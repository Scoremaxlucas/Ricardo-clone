/**
 * Täglich: SIC-Expiry-Reminders, Status EXPIRED, Doc-Löschung nach 30 Tagen,
 * Datenschutzfrist für unfertige Zertifikate (mit Vorwarnung), Upload-Nudges,
 * Stale-PENDING-Payments → CANCELLED, MagicLink/RateLimit-Cleanup.
 *
 * Zertifikate ohne `expiresAt` sind noch nicht ausgestellt — sie laufen nicht ab.
 * Gekaufte Module verfallen nie; gelöscht werden nur hochgeladene Dateien.
 */

import { prisma } from '@/lib/prisma'
import { deleteSicBlob } from '@/lib/sic/blob-delete'
import {
  sendSicDocsPurgeWarningEmail,
  sendSicExpiredEmail,
  sendSicExpiryReminderEmail,
  sendSicUploadReminderEmail,
} from '@/lib/sic/email'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { isSicModuleId, type SicModuleId } from '@/lib/sic/modules'
import { loadSicRenewalPending } from '@/lib/sic/renewal'
import { cronBudgetState } from '@/lib/sic/refund-gate'
import {
  sicUploadNudgeRepeatAfter,
  sicUploadNudgeWindows,
} from '@/lib/sic/upload-nudge'
import {
  addCalendarMonths,
  SIC_DOCS_RETENTION_DAYS,
  SIC_UNFINISHED_DOCS_RETENTION_MONTHS,
} from '@/lib/sic/validity'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000
const BUDGET_MS = 50_000
const BATCH = 150
const CLEANUP_BATCH = 500

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[sic-certificate-expiry] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const startedAtMs = Date.now()
  let hitBudget = false

  const stats = {
    reminded14d: 0,
    reminded3d: 0,
    expired: 0,
    docsDeleted: 0,
    purgeWarnings: 0,
    unfinishedDocsDeleted: 0,
    uploadNudges: 0,
    paymentsCancelled: 0,
    magicLinksDeleted: 0,
    rateLimitsDeleted: 0,
    scanKeysDeleted: 0,
  }

  function stillBudget(lastBatchSize: number): boolean {
    const { withinBudget } = cronBudgetState({
      startedAtMs,
      budgetMs: BUDGET_MS,
      lastBatchSize,
      batchSize: BATCH,
    })
    if (!withinBudget) {
      hitBudget = true
      return false
    }
    return true
  }

  try {
    // — PENDING Payments > 24h → CANCELLED —
    const stale = await prisma.sicPayment.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(now.getTime() - DAY_MS) },
      },
      data: { status: 'CANCELLED' },
    })
    stats.paymentsCancelled = stale.count

    // — Ablauf-Erinnerungen 14 und 3 Tage vorher —
    // Fehlgeschlagene Mails werden für diesen Lauf ausgeklammert, sonst holte die
    // Schleife bei einem Provider-Ausfall dieselbe Charge bis zum Budgetende neu.
    // Wer schon verlängert hat, bekommt keine Aufforderung mehr — nur das Flag.
    for (const reminder of [
      { days: 14, flag: 'expiryReminder14dSentAt', stat: 'reminded14d' },
      { days: 3, flag: 'expiryReminder3dSentAt', stat: 'reminded3d' },
    ] as const) {
      const failed: string[] = []
      while (stillBudget(BATCH)) {
        const batch = await prisma.sicCertificate.findMany({
          where: {
            status: 'ACTIVE',
            [reminder.flag]: null,
            expiresAt: { gt: now, lte: new Date(now.getTime() + reminder.days * DAY_MS) },
            ...(failed.length > 0 ? { id: { notIn: failed } } : {}),
          },
          take: BATCH,
          orderBy: { expiresAt: 'asc' },
        })
        if (batch.length === 0) break
        for (const c of batch) {
          if (!stillBudget(1)) break
          const expiresAt = c.expiresAt
          if (!expiresAt) continue
          const daysLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS))
          try {
            if (!(await loadSicRenewalPending(prisma, c.id))) {
              await sendSicExpiryReminderEmail({ email: c.email, daysLeft, expiresAt })
              stats[reminder.stat]++
            }
            await prisma.sicCertificate.update({
              where: { id: c.id },
              data: { [reminder.flag]: now },
            })
          } catch (e) {
            failed.push(c.id)
            console.error(`[sic-certificate-expiry] ${reminder.days}d mail`, c.id, e)
          }
        }
        if (batch.length < BATCH) break
        if (!stillBudget(batch.length)) break
      }
    }

    // — Mark EXPIRED, mit kurzer Mitteilung und Weg zur Verlängerung —
    // Erst die Mail, dann der Status: was das Budget nicht mehr schafft, bleibt
    // ACTIVE und kommt im nächsten Lauf samt Mail dran. Eine fehlgeschlagene Mail
    // hält den Ablauf nicht auf.
    while (stillBudget(BATCH)) {
      const due = await prisma.sicCertificate.findMany({
        where: { status: 'ACTIVE', expiresAt: { lte: now } },
        select: { id: true, email: true, expiresAt: true },
        take: BATCH,
      })
      if (due.length === 0) break
      let handled = 0
      for (const c of due) {
        if (!stillBudget(1)) break
        handled++
        try {
          if (c.expiresAt && !(await loadSicRenewalPending(prisma, c.id))) {
            await sendSicExpiredEmail({ email: c.email, expiredAt: c.expiresAt })
          }
        } catch (e) {
          console.error('[sic-certificate-expiry] expired mail', c.id, e)
        }
        const res = await prisma.sicCertificate.updateMany({
          where: { id: c.id, status: 'ACTIVE', expiresAt: { lte: now } },
          data: { status: 'EXPIRED' },
        })
        stats.expired += res.count
      }
      if (handled < due.length || due.length < BATCH) break
    }

    // — Docs löschen: EXPIRED + expiresAt älter als die Aufbewahrungsfrist —
    // Nur Dateien von vor dem Ablauf. Was danach kam, ist ein neuer Nachweis
    // (Verlängerung) und wartet auf Prüfung — der fällt unter die Frist für Unfertiges.
    const retentionCutoff = new Date(now.getTime() - SIC_DOCS_RETENTION_DAYS * DAY_MS)
    let purgeCursor: string | undefined
    while (stillBudget(BATCH)) {
      const toPurge = await prisma.sicCertificate.findMany({
        where: {
          status: 'EXPIRED',
          expiresAt: { lt: retentionCutoff },
          documents: { some: {} },
          ...(purgeCursor ? { id: { gt: purgeCursor } } : {}),
        },
        select: {
          id: true,
          expiresAt: true,
          documents: { select: { id: true, blobUrl: true, moduleKind: true, uploadedAt: true } },
        },
        orderBy: { id: 'asc' },
        take: BATCH,
      })
      if (toPurge.length === 0) break
      for (const c of toPurge) {
        purgeCursor = c.id
        const old = c.documents.filter(d => !c.expiresAt || d.uploadedAt.getTime() <= c.expiresAt.getTime())
        if (old.length === 0) continue
        for (const d of old) {
          await deleteSicBlob(d.blobUrl)
        }
        const delRes = await prisma.sicDocument.deleteMany({ where: { id: { in: old.map(d => d.id) } } })
        stats.docsDeleted += delRes.count
        // Angaben in Prüfung, denen jetzt jede Datei fehlt, zurück auf «Unterlagen fehlen».
        const kept = new Set(c.documents.filter(d => !old.includes(d)).map(d => d.moduleKind))
        const emptied = Array.from(new Set(old.map(d => d.moduleKind))).filter(k => !kept.has(k))
        if (emptied.length > 0) {
          await prisma.sicCertificateModule.updateMany({
            where: { certificateId: c.id, moduleKind: { in: emptied }, status: { in: ['IN_REVIEW', 'REJECTED'] } },
            data: { status: 'PENDING_DOCS', uploadReminderSentAt: null },
          })
        }
      }
      if (toPurge.length < BATCH) break
      if (!stillBudget(toPurge.length)) break
    }

    // — Datenschutzfrist unfertige Zertifikate: Vorwarnung einen Monat vorher —
    const warnFrom = addCalendarMonths(now, -(SIC_UNFINISHED_DOCS_RETENTION_MONTHS - 1))
    while (stillBudget(BATCH)) {
      const toWarn = await prisma.sicCertificate.findMany({
        where: {
          certifiedAt: null,
          docsPurgeWarningSentAt: null,
          issuedAt: { lte: warnFrom },
          documents: { some: {} },
        },
        select: { id: true, email: true, issuedAt: true },
        take: BATCH,
        orderBy: { issuedAt: 'asc' },
      })
      if (toWarn.length === 0) break
      for (const c of toWarn) {
        if (!stillBudget(1)) break
        try {
          const { url } = await createSicMagicLink(c.email)
          await sendSicDocsPurgeWarningEmail({
            email: c.email,
            purgeAt: addCalendarMonths(c.issuedAt, SIC_UNFINISHED_DOCS_RETENTION_MONTHS),
            magicLinkUrl: url,
          })
          await prisma.sicCertificate.update({
            where: { id: c.id },
            data: { docsPurgeWarningSentAt: now },
          })
          stats.purgeWarnings++
        } catch (e) {
          console.error('[sic-certificate-expiry] purge warning', c.id, e)
        }
      }
      if (toWarn.length < BATCH) break
      if (!stillBudget(toWarn.length)) break
    }

    // — Datenschutzfrist unfertige Zertifikate: Dateien löschen, Anspruch bleibt —
    const unfinishedCutoff = addCalendarMonths(now, -SIC_UNFINISHED_DOCS_RETENTION_MONTHS)
    while (stillBudget(BATCH)) {
      const toPurge = await prisma.sicCertificate.findMany({
        where: {
          certifiedAt: null,
          issuedAt: { lt: unfinishedCutoff },
          documents: { some: {} },
        },
        select: { id: true, documents: { select: { id: true, blobUrl: true } } },
        take: BATCH,
      })
      if (toPurge.length === 0) break
      for (const c of toPurge) {
        for (const d of c.documents) {
          await deleteSicBlob(d.blobUrl)
        }
        const delRes = await prisma.sicDocument.deleteMany({ where: { certificateId: c.id } })
        // Ohne Dateien ist keine Prüfung möglich — zurück auf «Unterlagen fehlen».
        await prisma.sicCertificateModule.updateMany({
          where: { certificateId: c.id, status: { in: ['IN_REVIEW', 'REJECTED'] } },
          data: { status: 'PENDING_DOCS', uploadReminderSentAt: null },
        })
        stats.unfinishedDocsDeleted += delRes.count
      }
      if (toPurge.length < BATCH) break
      if (!stillBudget(toPurge.length)) break
    }

    // — Datenschutzfrist nach Verlängerung ohne neuen Auszug —
    // Nach einer Verlängerung eines abgelaufenen Zertifikats gibt es keine Frist, bis der
    // neue Auszug geprüft ist. Kommt er nie, gilt dieselbe Frist wie für Unfertiges, ab
    // der letzten bezahlten Verlängerung gerechnet.
    let stuckCursor: string | undefined
    while (stillBudget(BATCH)) {
      const stuck = await prisma.sicCertificate.findMany({
        where: {
          status: 'ACTIVE',
          certifiedAt: { not: null },
          expiresAt: null,
          documents: { some: {} },
          payments: { some: { isRenewal: true, status: 'PAID', paidAt: { lt: unfinishedCutoff } } },
          ...(stuckCursor ? { id: { gt: stuckCursor } } : {}),
        },
        select: {
          id: true,
          payments: {
            where: { isRenewal: true, status: 'PAID' },
            orderBy: { paidAt: 'desc' },
            take: 1,
            select: { paidAt: true },
          },
          documents: { select: { id: true, blobUrl: true } },
        },
        orderBy: { id: 'asc' },
        take: BATCH,
      })
      if (stuck.length === 0) break
      for (const c of stuck) {
        stuckCursor = c.id
        const lastRenewal = c.payments[0]?.paidAt
        if (!lastRenewal || lastRenewal.getTime() >= unfinishedCutoff.getTime()) continue
        for (const d of c.documents) {
          await deleteSicBlob(d.blobUrl)
        }
        const delRes = await prisma.sicDocument.deleteMany({ where: { certificateId: c.id } })
        await prisma.sicCertificateModule.updateMany({
          where: { certificateId: c.id, status: { in: ['IN_REVIEW', 'REJECTED'] } },
          data: { status: 'PENDING_DOCS', uploadReminderSentAt: null },
        })
        stats.unfinishedDocsDeleted += delRes.count
      }
      if (stuck.length < BATCH) break
      if (!stillBudget(stuck.length)) break
    }

    // — Upload nudges: eine Mail pro Zertifikat mit allen fehlenden Nachweisen —
    // Fällig: selbst beschaffbar nach Tag 1, Drittunterschrift nach ~3 Tagen.
    // Gate pro Zertifikat: höchstens eine Erinnerung pro Woche, auch bei Nachkäufen.
    const remAfter = sicUploadNudgeRepeatAfter(now)
    const dueWindows = sicUploadNudgeWindows(now)
    const dueWhere = dueWindows.map(w => ({
      moduleKind: { in: w.moduleKinds },
      paidAt: { lte: w.paidBefore },
    }))
    const nudgedCertificates = new Set<string>()
    while (stillBudget(BATCH)) {
      const dueModules = await prisma.sicCertificateModule.findMany({
        where: {
          status: 'PENDING_DOCS',
          OR: dueWhere,
          certificateId: nudgedCertificates.size > 0 ? { notIn: Array.from(nudgedCertificates) } : undefined,
        },
        select: { certificateId: true },
        distinct: ['certificateId'],
        take: BATCH,
        orderBy: { paidAt: 'asc' },
      })
      if (dueModules.length === 0) break
      let processed = 0
      for (const { certificateId } of dueModules) {
        if (!stillBudget(1)) break
        processed++
        nudgedCertificates.add(certificateId)

        // Alle offenen Angaben dieses Zertifikats — auch die noch nicht fälligen.
        const openModules = await prisma.sicCertificateModule.findMany({
          where: { certificateId, status: 'PENDING_DOCS' },
          select: { id: true, moduleKind: true, uploadReminderSentAt: true },
        })
        // Wochen-Gate auf Zertifikatsebene: irgendeine Erinnerung in den letzten 7 Tagen → still.
        if (openModules.some(m => m.uploadReminderSentAt && m.uploadReminderSentAt >= remAfter)) continue

        const docs = await prisma.sicDocument.groupBy({
          by: ['moduleKind'],
          where: { certificateId, moduleKind: { in: openModules.map(m => m.moduleKind) } },
          _count: { _all: true },
        })
        const hasDocs = new Set(docs.map(d => d.moduleKind))
        const missing = openModules.filter(m => !hasDocs.has(m.moduleKind) && isSicModuleId(m.moduleKind))
        if (missing.length === 0) continue

        const certificate = await prisma.sicCertificate.findUnique({
          where: { id: certificateId },
          select: { email: true },
        })
        if (!certificate) continue

        try {
          const { url } = await createSicMagicLink(certificate.email)
          await sendSicUploadReminderEmail({
            email: certificate.email,
            moduleKinds: missing.map(m => m.moduleKind as SicModuleId),
            magicLinkUrl: url,
          })
          await prisma.sicCertificateModule.updateMany({
            where: { id: { in: missing.map(m => m.id) } },
            data: { uploadReminderSentAt: now },
          })
          stats.uploadNudges++
        } catch (e) {
          console.error('[sic-certificate-expiry] upload nudge', certificateId, e)
        }
      }
      if (dueModules.length < BATCH) break
      if (!stillBudget(processed)) break
    }

    // — Cleanup Magic Links (expiresAt < now - 7d) —
    const magicCutoff = new Date(now.getTime() - 7 * DAY_MS)
    while (stillBudget(CLEANUP_BATCH)) {
      const old = await prisma.sicMagicLink.findMany({
        where: { expiresAt: { lt: magicCutoff } },
        select: { id: true },
        take: CLEANUP_BATCH,
      })
      if (old.length === 0) break
      const delML = await prisma.sicMagicLink.deleteMany({
        where: { id: { in: old.map(r => r.id) } },
      })
      stats.magicLinksDeleted += delML.count
      if (old.length < CLEANUP_BATCH) break
      if (!stillBudget(old.length)) break
    }

    // — Cleanup Rate Limits (createdAt < now - 2d) —
    const rlCutoff = new Date(now.getTime() - 2 * DAY_MS)
    while (stillBudget(CLEANUP_BATCH)) {
      const old = await prisma.rateLimit.findMany({
        where: { createdAt: { lt: rlCutoff } },
        select: { id: true },
        take: CLEANUP_BATCH,
      })
      if (old.length === 0) break
      const delRl = await prisma.rateLimit.deleteMany({
        where: { id: { in: old.map(r => r.id) } },
      })
      stats.rateLimitsDeleted += delRl.count
      if (old.length < CLEANUP_BATCH) break
      if (!stillBudget(old.length)) break
    }

    // — Cleanup Scan-Entdoppelung: nach 30 Tagen ist der Tagesschlüssel nutzlos —
    const scanCutoff = new Date(now.getTime() - 30 * DAY_MS)
    while (stillBudget(CLEANUP_BATCH)) {
      const old = await prisma.sicVerifyScan.findMany({
        where: { createdAt: { lt: scanCutoff } },
        select: { id: true },
        take: CLEANUP_BATCH,
      })
      if (old.length === 0) break
      const delScans = await prisma.sicVerifyScan.deleteMany({
        where: { id: { in: old.map(r => r.id) } },
      })
      stats.scanKeysDeleted += delScans.count
      if (old.length < CLEANUP_BATCH) break
      if (!stillBudget(old.length)) break
    }

    const truncated = hitBudget

    const durationMs = Date.now() - startedAtMs
    sicLog('sic.cron.expiry', { ...stats, truncated, durationMs })
    sicLog('sic.cron.cleanup', {
      magicLinksDeleted: stats.magicLinksDeleted,
      rateLimitsDeleted: stats.rateLimitsDeleted,
      scanKeysDeleted: stats.scanKeysDeleted,
      truncated,
      durationMs,
    })

    return NextResponse.json({ ok: true, ...stats, truncated, durationMs })
  } catch (err) {
    console.error('[sic-certificate-expiry] failed', err)
    sicLog('sic.cron.expiry_failed', { error: String(err) })
    return NextResponse.json({ ok: false, error: 'Internal' }, { status: 500 })
  }
}
