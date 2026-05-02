/**
 * Täglich (Vercel Cron): E-Mail ca. 14 bzw. 3 Tage vor Ablauf des Helvenda Qualitätsnachweises (ACTIVE).
 */

import { sendTenantCertificateExpirySoonEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[certificate-expiry-reminders] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const d13 = addDays(now, 13)
  const d14 = addDays(now, 14)
  const d3 = addDays(now, 3)

  let sent14 = 0
  let sent3 = 0
  const errors: string[] = []

  try {
    const certs14 = await prisma.helvendaCertificate.findMany({
      where: {
        status: 'ACTIVE',
        expiryReminder14dSentAt: null,
        expiresAt: { gt: d13, lte: d14 },
      },
      include: { user: { select: { email: true, firstName: true, name: true } } },
    })

    for (const c of certs14) {
      const email = c.user?.email?.trim()
      if (!email) continue
      try {
        await sendTenantCertificateExpirySoonEmail({
          tenantEmail: email,
          tenantUserId: c.userId,
          tenantFirst: c.user ?? {},
          expiresOn: c.expiresAt,
          daysBefore: 14,
          certificateCode: c.certificateCode,
        })
        await prisma.helvendaCertificate.update({
          where: { id: c.id },
          data: { expiryReminder14dSentAt: new Date() },
        })
        sent14 += 1
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`14d ${c.id}: ${msg}`)
        console.error('[certificate-expiry-reminders] 14d', c.id, e)
      }
    }

    const certs3 = await prisma.helvendaCertificate.findMany({
      where: {
        status: 'ACTIVE',
        expiryReminder3dSentAt: null,
        expiresAt: { gt: now, lte: d3 },
      },
      include: { user: { select: { email: true, firstName: true, name: true } } },
    })

    for (const c of certs3) {
      const email = c.user?.email?.trim()
      if (!email) continue
      try {
        await sendTenantCertificateExpirySoonEmail({
          tenantEmail: email,
          tenantUserId: c.userId,
          tenantFirst: c.user ?? {},
          expiresOn: c.expiresAt,
          daysBefore: 3,
          certificateCode: c.certificateCode,
        })
        await prisma.helvendaCertificate.update({
          where: { id: c.id },
          data: { expiryReminder3dSentAt: new Date() },
        })
        sent3 += 1
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`3d ${c.id}: ${msg}`)
        console.error('[certificate-expiry-reminders] 3d', c.id, e)
      }
    }

    return NextResponse.json({
      sent14,
      sent3,
      errors,
      ok: errors.length === 0,
      timestamp: new Date().toISOString(),
    })
  } catch (e: unknown) {
    console.error('[certificate-expiry-reminders]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
