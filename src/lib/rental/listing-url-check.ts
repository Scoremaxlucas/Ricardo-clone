import {
  sendAdminListingDeactivatedUrl404Email,
  sendAdminListingDeactivatedUrlRentedEmail,
  sendAdminListingUrlUnreachableStreakEmail,
} from '@/lib/rental/emails'
import { htmlToListingPlainText } from '@/lib/rental/listing-url-import-html'
import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'
import { findFirstRentedKeywordInPlainText } from '@/lib/rental/listing-url-rented-keywords'
import { prisma } from '@/lib/prisma'

const USER_AGENT =
  'Mozilla/5.0 (compatible; HelvendarBot/1.0; +https://wohnen.helvenda.ch)'
const FETCH_TIMEOUT_MS = 8000

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

type ListingCheckRow = {
  id: string
  title: string
  address: string
  importedFrom: string | null
  urlUnreachableStreak: number
}

export async function runSingleRentalListingUrlCheck(
  listingId: string
): Promise<
  | { ok: false; reason: 'not_found' }
  | {
      ok: true
      outcome: 'manual' | 'unreachable' | 'gone' | 'rented' | 'active'
      lastCheckStatus: 'MANUAL' | 'UNREACHABLE' | 'GONE' | 'RENTED' | 'ACTIVE'
      detail?: string
    }
> {
  const row = await prisma.rentalListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      address: true,
      importedFrom: true,
      urlUnreachableStreak: true,
    },
  })
  if (!row) return { ok: false, reason: 'not_found' }
  return await processRentalListingUrlCheckRow(row)
}

export async function processRentalListingUrlCheckRow(row: ListingCheckRow): Promise<{
  ok: true
  outcome: 'manual' | 'unreachable' | 'gone' | 'rented' | 'active'
  lastCheckStatus: 'MANUAL' | 'UNREACHABLE' | 'GONE' | 'RENTED' | 'ACTIVE'
  detail?: string
}> {
  const now = new Date()
  const rawUrl = row.importedFrom

  if (!isHttpListingUrl(rawUrl)) {
    await prisma.rentalListing.update({
      where: { id: row.id },
      data: {
        lastCheckStatus: 'MANUAL',
        lastCheckedAt: now,
        urlUnreachableStreak: 0,
      },
    })
    return { ok: true, outcome: 'manual', lastCheckStatus: 'MANUAL' }
  }

  let safe: URL
  try {
    safe = await assertUrlSafeForServerFetch(rawUrl!)
  } catch {
    await prisma.rentalListing.update({
      where: { id: row.id },
      data: {
        lastCheckStatus: 'MANUAL',
        lastCheckedAt: now,
        urlUnreachableStreak: 0,
      },
    })
    return { ok: true, outcome: 'manual', lastCheckStatus: 'MANUAL', detail: 'URL nicht sicher prüfbar' }
  }

  let status = 0
  let html = ''
  try {
    const got = await fetchUrlForListingCheck(safe)
    status = got.status
    html = got.html
  } catch (e) {
    const streak = row.urlUnreachableStreak + 1
    await prisma.rentalListing.update({
      where: { id: row.id },
      data: {
        lastCheckStatus: 'UNREACHABLE',
        lastCheckedAt: now,
        urlUnreachableStreak: streak >= 3 ? 0 : streak,
      },
    })
    if (streak >= 3) {
      try {
        await sendAdminListingUrlUnreachableStreakEmail({
          listingId: row.id,
          listingTitle: row.title,
          address: row.address,
          importedFrom: rawUrl!,
        })
      } catch (mailErr) {
        console.error('[listing-url-check] E-Mail unreachable', row.id, mailErr)
      }
    }
    return {
      ok: true,
      outcome: 'unreachable',
      lastCheckStatus: 'UNREACHABLE',
      detail: e instanceof Error ? e.message : 'Fetch fehlgeschlagen',
    }
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
    try {
      await sendAdminListingDeactivatedUrl404Email({
        listingId: row.id,
        listingTitle: row.title,
        address: row.address,
        importedFrom: rawUrl!,
        deactivatedAt: now,
      })
    } catch (mailErr) {
      console.error('[listing-url-check] E-Mail 404', row.id, mailErr)
    }
    return { ok: true, outcome: 'gone', lastCheckStatus: 'GONE' }
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
    if (streak >= 3) {
      try {
        await sendAdminListingUrlUnreachableStreakEmail({
          listingId: row.id,
          listingTitle: row.title,
          address: row.address,
          importedFrom: rawUrl!,
        })
      } catch (mailErr) {
        console.error('[listing-url-check] E-Mail unreachable', row.id, mailErr)
      }
    }
    return {
      ok: true,
      outcome: 'unreachable',
      lastCheckStatus: 'UNREACHABLE',
      detail: `HTTP ${status}`,
    }
  }

  let keyword: string | null = null
  try {
    const plain = htmlToListingPlainText(html, 120_000)
    keyword = findFirstRentedKeywordInPlainText(plain)
  } catch (parseErr) {
    console.error('[listing-url-check] HTML/Text', row.id, parseErr)
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
      console.error('[listing-url-check] E-Mail rented', row.id, mailErr)
    }
    return { ok: true, outcome: 'rented', lastCheckStatus: 'RENTED', detail: keyword }
  }

  await prisma.rentalListing.update({
    where: { id: row.id },
    data: {
      lastCheckStatus: 'ACTIVE',
      lastCheckedAt: now,
      urlUnreachableStreak: 0,
    },
  })
  return { ok: true, outcome: 'active', lastCheckStatus: 'ACTIVE' }
}
