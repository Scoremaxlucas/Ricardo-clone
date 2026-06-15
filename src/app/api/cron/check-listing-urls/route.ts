/**
 * Täglich (Vercel Cron): aktive Miet-Inserate mit Original-URL prüfen (404 / „vergeben“ / Erreichbarkeit).
 */

import { processRentalListingUrlCheckRow } from '@/lib/rental/listing-url-check'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[check-listing-urls] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  let checked = 0
  let deactivated = 0
  let active = 0
  let unreachable = 0

  try {
    const baseWhere = {
      status: 'active' as const,
      OR: [{ monitoringUrl: { not: null } }, { importedFrom: { not: null } }],
    }
    const select = {
      id: true,
      title: true,
      address: true,
      monitoringUrl: true,
      importedFrom: true,
      urlUnreachableStreak: true,
    } as const

    const neverChecked = await prisma.rentalListing.findMany({
      where: { ...baseWhere, lastCheckedAt: null },
      orderBy: { createdAt: 'asc' },
      take: BATCH_LIMIT,
      select,
    })
    const remaining = BATCH_LIMIT - neverChecked.length
    const olderChecked =
      remaining > 0 ?
        await prisma.rentalListing.findMany({
          where: { ...baseWhere, lastCheckedAt: { lt: dayAgo } },
          orderBy: { lastCheckedAt: 'asc' },
          take: remaining,
          select,
        })
      : []

    const listings = [...neverChecked, ...olderChecked]

    for (const row of listings) {
      checked += 1
      try {
        const result = await processRentalListingUrlCheckRow(row)
        if (result.outcome === 'unreachable') unreachable += 1
        else if (result.outcome === 'gone' || result.outcome === 'rented') deactivated += 1
        else if (result.outcome === 'active') active += 1
      } catch (loopErr) {
        console.error('[check-listing-urls] listing', row.id, loopErr)
      }
    }

    if (deactivated > 0) {
      try {
        revalidatePath('/wohnungen')
        revalidatePath('/admin/listings')
        revalidatePath('/matching/properties')
      } catch (revErr) {
        console.error('[check-listing-urls] revalidatePath', revErr)
      }
    }

    return NextResponse.json({ checked, deactivated, active, unreachable })
  } catch (e: unknown) {
    console.error('[check-listing-urls]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
