/**
 * Täglich (Vercel Cron): Miet-Inserate mit abgelaufenem Kalender-Gültigkeitsdatum archivieren,
 * Vermieter:in und Admin benachrichtigen, Admin-Review-Flag setzen.
 */

import {
  isListingExpiredByChCalendar,
  todayYmdInZurich,
} from '@/lib/rental/rental-listing-expiry-on'
import {
  sendAdminListingExpiredCalendarEmail,
  sendLandlordListingExpiredCalendarEmail,
} from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { DeactivationReason } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 80

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[rental-listing-expiry] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let archived = 0

  try {
    const candidates = await prisma.rentalListing.findMany({
      where: {
        status: 'active',
        listingExpiresOn: { not: null },
      },
      orderBy: { listingExpiresOn: 'asc' },
      take: BATCH_LIMIT,
      select: {
        id: true,
        title: true,
        address: true,
        listingExpiresOn: true,
        userId: true,
      },
    })

    for (const row of candidates) {
      const on = row.listingExpiresOn
      if (!on || !isListingExpiredByChCalendar(on, now)) {
        continue
      }

      await prisma.rentalListing.update({
        where: { id: row.id },
        data: {
          status: 'archived',
          autoDeactivatedAt: now,
          autoDeactivatedReason: DeactivationReason.LISTING_EXPIRED,
          needsExpiryReview: true,
        },
      })
      archived += 1

      const user = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { email: true, firstName: true, name: true },
      })
      if (user?.email?.trim()) {
        try {
          await sendLandlordListingExpiredCalendarEmail({
            landlordEmail: user.email.trim(),
            landlordUserId: row.userId,
            landlordFirst: { firstName: user.firstName, name: user.name },
            listingId: row.id,
            listingTitle: row.title,
            address: row.address,
            listingExpiresOn: on,
            deactivatedAt: now,
          })
        } catch (e) {
          console.error('[rental-listing-expiry] landlord mail', row.id, e)
        }
      }

      try {
        await sendAdminListingExpiredCalendarEmail({
          listingId: row.id,
          listingTitle: row.title,
          address: row.address,
          listingExpiresOn: on,
          deactivatedAt: now,
        })
      } catch (e) {
        console.error('[rental-listing-expiry] admin mail', row.id, e)
      }
    }

    if (archived > 0) {
      try {
        revalidatePath('/wohnungen')
        revalidatePath('/admin/listings')
        revalidatePath('/matching/properties')
      } catch (revErr) {
        console.error('[rental-listing-expiry] revalidatePath', revErr)
      }
    }

    return NextResponse.json({
      ok: true,
      today: todayYmdInZurich(now),
      archived,
      scanned: candidates.length,
    })
  } catch (e: unknown) {
    console.error('[rental-listing-expiry]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
