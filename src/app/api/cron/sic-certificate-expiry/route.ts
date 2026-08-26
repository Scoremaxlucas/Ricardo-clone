/**
 * Täglich: SIC-Expiry-Reminders, Status EXPIRED, Doc-Löschung nach 30 Tagen,
 * Datenschutzfrist für unfertige Zertifikate (mit Vorwarnung), Upload-Nudges,
 * Stale-PENDING-Payments → CANCELLED, MagicLink/RateLimit-Cleanup.
 *
 * Zertifikate ohne `expiresAt` sind noch nicht ausgestellt — sie laufen nicht ab.
 * Gekaufte Module verfallen nie; gelöscht werden nur hochgeladene Dateien.
 */

import { prisma } from '@/lib/prisma'
import {
  sendSicDocsPurgeWarningEmail,
  sendSicExpiryReminderEmail,
  sendSicUploadReminderEmail,
} from '@/lib/sic/email'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { getSicModule, type SicModuleId } from '@/lib/sic/modules'
import { cronBudgetState } from '@/lib/sic/refund-gate'
import {
  addCalendarMonths,
  SIC_DOCS_RETENTION_DAYS,
  SIC_UNFINISHED_DOCS_RETENTION_MONTHS,
} from '@/lib/sic/validity'
import { del } from '@vercel/blob'
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

    // — 14d Reminder (loop) —
    while (stillBudget(BATCH)) {
      const batch = await prisma.sicCertificate.findMany({
        where: {
          status: 'ACTIVE',
          expiryReminder14dSentAt: null,
          expiresAt: { gt: now, lte: new Date(now.getTime() + 14 * DAY_MS) },
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
          const { url } = await createSicMagicLink(c.email)
          await sendSicExpiryReminderEmail({
            email: c.email,
            daysLeft,
            expiresAt,
            magicLinkUrl: url,
          })
          await prisma.sicCertificate.update({
            where: { id: c.id },
            data: { expiryReminder14dSentAt: now },
          })
          stats.reminded14d++
        } catch (e) {
          console.error('[sic-certificate-expiry] 14d mail', c.id, e)
        }
      }
      if (batch.length < BATCH) break
      if (!stillBudget(batch.length)) break
    }

    // — 3d Reminder (loop) —
    while (stillBudget(BATCH)) {
      const batch = await prisma.sicCertificate.findMany({
        where: {
          status: 'ACTIVE',
          expiryReminder3dSentAt: null,
          expiresAt: { gt: now, lte: new Date(now.getTime() + 3 * DAY_MS) },
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
          const { url } = await createSicMagicLink(c.email)
          await sendSicExpiryReminderEmail({
            email: c.email,
            daysLeft,
            expiresAt,
            magicLinkUrl: url,
          })
          await prisma.sicCertificate.update({
            where: { id: c.id },
            data: { expiryReminder3dSentAt: now },
          })
          stats.reminded3d++
        } catch (e) {
          console.error('[sic-certificate-expiry] 3d mail', c.id, e)
        }
      }
      if (batch.length < BATCH) break
      if (!stillBudget(batch.length)) break
    }

    // — Mark EXPIRED —
    const expiredRes = await prisma.sicCertificate.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    })
    stats.expired = expiredRes.count

    // — Docs löschen: EXPIRED + expiresAt älter als die Aufbewahrungsfrist —
    const retentionCutoff = new Date(now.getTime() - SIC_DOCS_RETENTION_DAYS * DAY_MS)
    while (stillBudget(BATCH)) {
      const toPurge = await prisma.sicCertificate.findMany({
        where: {
          status: 'EXPIRED',
          expiresAt: { lt: retentionCutoff },
          documents: { some: {} },
        },
        select: {
          id: true,
          documents: { select: { id: true, blobUrl: true } },
        },
        take: BATCH,
      })
      if (toPurge.length === 0) break
      for (const c of toPurge) {
        for (const d of c.documents) {
          try {
            await del(d.blobUrl)
          } catch {
            // already gone
          }
        }
        const delRes = await prisma.sicDocument.deleteMany({ where: { certificateId: c.id } })
        stats.docsDeleted += delRes.count
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
          try {
            await del(d.blobUrl)
          } catch {
            // already gone
          }
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

    // — Upload nudges —
    const nudgeCutoff = new Date(now.getTime() - 3 * DAY_MS)
    const remIn7d = new Date(now.getTime() - 7 * DAY_MS)
    while (stillBudget(BATCH)) {
      const pendingModules = await prisma.sicCertificateModule.findMany({
        where: {
          status: 'PENDING_DOCS',
          paidAt: { lte: nudgeCutoff },
          OR: [{ uploadReminderSentAt: null }, { uploadReminderSentAt: { lt: remIn7d } }],
        },
        include: {
          certificate: { select: { email: true, id: true } },
        },
        take: BATCH,
        orderBy: { paidAt: 'asc' },
      })
      if (pendingModules.length === 0) break
      let processed = 0
      for (const m of pendingModules) {
        if (!stillBudget(1)) break
        const docCount = await prisma.sicDocument.count({
          where: { certificateId: m.certificateId, moduleKind: m.moduleKind },
        })
        if (docCount > 0) {
          processed++
          continue
        }
        try {
          const { url } = await createSicMagicLink(m.certificate.email)
          const title = getSicModule(m.moduleKind as SicModuleId).title
          await sendSicUploadReminderEmail({
            email: m.certificate.email,
            moduleTitle: title,
            magicLinkUrl: url,
          })
          await prisma.sicCertificateModule.update({
            where: { id: m.id },
            data: { uploadReminderSentAt: now },
          })
          stats.uploadNudges++
        } catch (e) {
          console.error('[sic-certificate-expiry] upload nudge', m.id, e)
        }
        processed++
      }
      if (pendingModules.length < BATCH) break
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
