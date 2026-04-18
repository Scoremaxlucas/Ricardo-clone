/**
 * Täglich (Vercel Cron): Erinnerung 3 Tage vor Ablauf des Betreibungsregister-Auszugs (Mieterprofil).
 */

import { sendTenantCreditExpiryReminderEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[credit-check-expiry] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const reminderCooldown = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  try {
    const profiles = await prisma.tenantProfile.findMany({
      where: {
        creditCheckStatus: 'APPROVED',
        creditCheckExpiresAt: {
          gt: now,
          lte: inThreeDays,
        },
        OR: [{ expiryReminderSentAt: null }, { expiryReminderSentAt: { lt: reminderCooldown } }],
      },
      include: {
        user: { select: { email: true, firstName: true, name: true } },
      },
    })

    let processed = 0
    for (const row of profiles) {
      const email = row.user?.email
      if (!email) continue
      try {
        await sendTenantCreditExpiryReminderEmail({
          tenantEmail: email,
          tenantUserId: row.userId,
          tenantFirst: row.user,
          expiresOn: row.creditCheckExpiresAt!,
        })
        await prisma.tenantProfile.update({
          where: { id: row.id },
          data: { expiryReminderSentAt: new Date() },
        })
        processed += 1
      } catch (e) {
        console.error('[credit-check-expiry] Profil', row.id, e)
      }
    }

    return NextResponse.json({ processed })
  } catch (e: unknown) {
    console.error('[credit-check-expiry]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
