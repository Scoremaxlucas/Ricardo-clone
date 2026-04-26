/**
 * Täglich (Vercel Cron): abgelaufene Helvenda-Zertifikate als EXPIRED markieren; optional Erinnerungs-Mail.
 */

import { sendTenantCertificateExpiredEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[expire-certificates] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  try {
    const rows = await prisma.helvendaCertificate.findMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      include: {
        user: { select: { email: true, firstName: true, name: true } },
        tenantProfile: { select: { creditCheckExpiresAt: true, creditCheckStatus: true } },
      },
    })

    if (rows.length === 0) {
      return NextResponse.json({ expired: 0, emails: 0 })
    }

    await prisma.helvendaCertificate.updateMany({
      where: { id: { in: rows.map(r => r.id) } },
      data: { status: 'EXPIRED' },
    })

    let emails = 0
    for (const c of rows) {
      const tp = c.tenantProfile
      const creditGone =
        !tp ||
        tp.creditCheckStatus !== 'APPROVED' ||
        !tp.creditCheckExpiresAt ||
        tp.creditCheckExpiresAt.getTime() <= now.getTime()
      const email = c.user?.email?.trim()
      if (!creditGone || !email) continue
      try {
        await sendTenantCertificateExpiredEmail({
          tenantEmail: email,
          tenantUserId: c.userId,
          tenantFirst: c.user ?? {},
        })
        emails += 1
      } catch (e) {
        console.error('[expire-certificates] mail', c.id, e)
      }
    }

    return NextResponse.json({ expired: rows.length, emails })
  } catch (e: unknown) {
    console.error('[expire-certificates]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
