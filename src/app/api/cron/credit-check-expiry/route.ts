/**
 * Täglich (Vercel Cron): Erinnerung ca. 14 Tage und 3 Tage vor Ablauf des Betreibungsregister-Auszugs (Mieterprofil).
 */

import {
  sendTenantCreditExpiryReminder14dEmail,
  sendTenantCreditExpiryReminderEmail,
} from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

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
  const inThreeDays = addDays(now, 3)
  const reminderCooldown = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const d13 = addDays(now, 13)
  const d14 = addDays(now, 14)

  try {
    const profiles14 = await prisma.tenantProfile.findMany({
      where: {
        creditCheckStatus: 'APPROVED',
        creditCheckExpiresAt: { gt: d13, lte: d14 },
        creditCheckExpiryReminder14dSentAt: null,
      },
      include: {
        user: { select: { email: true, firstName: true, name: true } },
      },
    })

    let processed14 = 0
    for (const row of profiles14) {
      const email = row.user?.email
      if (!email) continue
      try {
        await sendTenantCreditExpiryReminder14dEmail({
          tenantEmail: email,
          tenantUserId: row.userId,
          tenantFirst: row.user,
          expiresOn: row.creditCheckExpiresAt!,
        })
        await prisma.tenantProfile.update({
          where: { id: row.id },
          data: { creditCheckExpiryReminder14dSentAt: new Date() },
        })
        processed14 += 1
      } catch (e) {
        console.error('[credit-check-expiry] 14d Profil', row.id, e)
      }
    }

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

    let processed3 = 0
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
        processed3 += 1
      } catch (e) {
        console.error('[credit-check-expiry] 3d Profil', row.id, e)
      }
    }

    return NextResponse.json({ processed14, processed3 })
  } catch (e: unknown) {
    console.error('[credit-check-expiry]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
