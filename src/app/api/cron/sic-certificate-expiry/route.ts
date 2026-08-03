/**
 * Täglich: SIC-Expiry-Reminders, Status EXPIRED, Doc-Löschung nach 30 Tagen,
 * Upload-Nudges, Stale-PENDING-Payments → CANCELLED.
 */

import { prisma } from '@/lib/prisma'
import {
  sendSicExpiryReminderEmail,
  sendSicUploadReminderEmail,
} from '@/lib/sic/email'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { getSicModule } from '@/lib/sic/modules'
import { del } from '@vercel/blob'
import type { SicModuleId } from '@/lib/sic/modules'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

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
  const stats = {
    reminded14d: 0,
    reminded3d: 0,
    expired: 0,
    docsDeleted: 0,
    uploadNudges: 0,
    paymentsCancelled: 0,
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

    // — 14d Reminder —
    const in14 = await prisma.sicCertificate.findMany({
      where: {
        status: 'ACTIVE',
        expiryReminder14dSentAt: null,
        expiresAt: {
          gt: now,
          lte: new Date(now.getTime() + 14 * DAY_MS),
        },
      },
      take: 200,
    })
    for (const c of in14) {
      const daysLeft = Math.max(1, Math.ceil((c.expiresAt.getTime() - now.getTime()) / DAY_MS))
      try {
        const { url } = await createSicMagicLink(c.email)
        await sendSicExpiryReminderEmail({
          email: c.email,
          daysLeft,
          expiresAt: c.expiresAt,
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

    // — 3d Reminder —
    const in3 = await prisma.sicCertificate.findMany({
      where: {
        status: 'ACTIVE',
        expiryReminder3dSentAt: null,
        expiresAt: {
          gt: now,
          lte: new Date(now.getTime() + 3 * DAY_MS),
        },
      },
      take: 200,
    })
    for (const c of in3) {
      const daysLeft = Math.max(1, Math.ceil((c.expiresAt.getTime() - now.getTime()) / DAY_MS))
      try {
        const { url } = await createSicMagicLink(c.email)
        await sendSicExpiryReminderEmail({
          email: c.email,
          daysLeft,
          expiresAt: c.expiresAt,
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

    // — Mark EXPIRED —
    const expiredRes = await prisma.sicCertificate.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    })
    stats.expired = expiredRes.count

    // — Docs löschen: EXPIRED + expiresAt < now - 30d —
    const retentionCutoff = new Date(now.getTime() - 30 * DAY_MS)
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
      take: 100,
    })
    for (const c of toPurge) {
      for (const d of c.documents) {
        try {
          await del(d.blobUrl)
        } catch {
          // already gone / public store mismatch
        }
      }
      const delRes = await prisma.sicDocument.deleteMany({ where: { certificateId: c.id } })
      stats.docsDeleted += delRes.count
    }

    // — Upload nudges: PENDING_DOCS, paidAt > 3d, no docs, max 1 / 7d —
    const nudgeCutoff = new Date(now.getTime() - 3 * DAY_MS)
    const remIn7d = new Date(now.getTime() - 7 * DAY_MS)
    const pendingModules = await prisma.sicCertificateModule.findMany({
      where: {
        status: 'PENDING_DOCS',
        paidAt: { lte: nudgeCutoff },
        OR: [{ uploadReminderSentAt: null }, { uploadReminderSentAt: { lt: remIn7d } }],
      },
      include: {
        certificate: { select: { email: true, id: true } },
      },
      take: 100,
    })
    for (const m of pendingModules) {
      const docCount = await prisma.sicDocument.count({
        where: { certificateId: m.certificateId, moduleKind: m.moduleKind },
      })
      if (docCount > 0) continue
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
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    console.error('[sic-certificate-expiry] failed', err)
    return NextResponse.json({ ok: false, error: 'Internal' }, { status: 500 })
  }
}
