/**
 * Täglich (Vercel Cron): aktive Miet-Inserate mit Original-URL prüfen (404 / „vergeben“ / Erreichbarkeit).
 */

import {
  sendAdminListingDeactivatedUrl404Email,
  sendAdminListingDeactivatedUrlRentedEmail,
  sendAdminListingUrlUnreachableStreakEmail,
} from '@/lib/rental/emails'
import { htmlToListingPlainText } from '@/lib/rental/listing-url-import-html'
import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'
import { findFirstRentedKeywordInPlainText } from '@/lib/rental/listing-url-rented-keywords'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const USER_AGENT =
  'Mozilla/5.0 (compatible; HelvendarBot/1.0; +https://wohnen.helvenda.ch)'
const FETCH_TIMEOUT_MS = 8000
const BATCH_LIMIT = 50

function isHttpListingUrl(raw: string | null): boolean {
  if (!raw?.trim()) return false
  const t = raw.trim().toLowerCase()
  return t.startsWith('http://') || t.startsWith('https://')
}

async function fetchUrlForListingCheck(url: URL): Promise<{ status: number; html: string }> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-CH,de;q=0.9,fr;q=0.8,en;q=0.7',
      },
    })
    const buf = await res.arrayBuffer()
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    return { status: res.status, html }
  } finally {
    clearTimeout(t)
  }
}

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
      importedFrom: { not: null } as const,
    }
    const select = {
      id: true,
      title: true,
      address: true,
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
      const rawUrl = row.importedFrom
      try {
        if (!isHttpListingUrl(rawUrl)) {
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'MANUAL',
              lastCheckedAt: now,
              urlUnreachableStreak: 0,
            },
          })
          continue
        }

        let safe: URL
        try {
          safe = await assertUrlSafeForServerFetch(rawUrl!)
        } catch (e) {
          console.error('[check-listing-urls] unsichere URL', row.id, e)
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'MANUAL',
              lastCheckedAt: now,
              urlUnreachableStreak: 0,
            },
          })
          continue
        }

        let status = 0
        let html = ''
        try {
          const got = await fetchUrlForListingCheck(safe)
          status = got.status
          html = got.html
        } catch (e) {
          console.error('[check-listing-urls] fetch', row.id, e)
          const streak = row.urlUnreachableStreak + 1
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'UNREACHABLE',
              lastCheckedAt: now,
              urlUnreachableStreak: streak >= 3 ? 0 : streak,
            },
          })
          unreachable += 1
          if (streak >= 3) {
            try {
              await sendAdminListingUrlUnreachableStreakEmail({
                listingId: row.id,
                listingTitle: row.title,
                address: row.address,
                importedFrom: rawUrl!,
              })
            } catch (mailErr) {
              console.error('[check-listing-urls] E-Mail unreachable', row.id, mailErr)
            }
          }
          continue
        }

        if (status === 404 || status === 410) {
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'GONE',
              lastCheckedAt: now,
              status: 'archived',
              autoDeactivatedAt: now,
              autoDeactivatedReason: 'URL_404',
              urlUnreachableStreak: 0,
            },
          })
          deactivated += 1
          try {
            await sendAdminListingDeactivatedUrl404Email({
              listingId: row.id,
              listingTitle: row.title,
              address: row.address,
              importedFrom: rawUrl!,
              deactivatedAt: now,
            })
          } catch (mailErr) {
            console.error('[check-listing-urls] E-Mail 404', row.id, mailErr)
          }
          continue
        }

        if (status !== 200) {
          const streak = row.urlUnreachableStreak + 1
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'UNREACHABLE',
              lastCheckedAt: now,
              urlUnreachableStreak: streak >= 3 ? 0 : streak,
            },
          })
          unreachable += 1
          if (streak >= 3) {
            try {
              await sendAdminListingUrlUnreachableStreakEmail({
                listingId: row.id,
                listingTitle: row.title,
                address: row.address,
                importedFrom: rawUrl!,
              })
            } catch (mailErr) {
              console.error('[check-listing-urls] E-Mail unreachable', row.id, mailErr)
            }
          }
          continue
        }

        let keyword: string | null = null
        try {
          const plain = htmlToListingPlainText(html, 120_000)
          keyword = findFirstRentedKeywordInPlainText(plain)
        } catch (parseErr) {
          console.error('[check-listing-urls] HTML/Text', row.id, parseErr)
        }

        if (keyword) {
          await prisma.rentalListing.update({
            where: { id: row.id },
            data: {
              lastCheckStatus: 'RENTED',
              lastCheckedAt: now,
              status: 'archived',
              autoDeactivatedAt: now,
              autoDeactivatedReason: 'URL_RENTED',
              urlUnreachableStreak: 0,
            },
          })
          deactivated += 1
          try {
            await sendAdminListingDeactivatedUrlRentedEmail({
              listingId: row.id,
              listingTitle: row.title,
              address: row.address,
              importedFrom: rawUrl!,
              keyword,
              deactivatedAt: now,
            })
          } catch (mailErr) {
            console.error('[check-listing-urls] E-Mail rented', row.id, mailErr)
          }
          continue
        }

        await prisma.rentalListing.update({
          where: { id: row.id },
          data: {
            lastCheckStatus: 'ACTIVE',
            lastCheckedAt: now,
            urlUnreachableStreak: 0,
          },
        })
        active += 1
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
