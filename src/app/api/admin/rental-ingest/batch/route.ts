import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { createRentalListingFromIngestOrchestrator } from '@/lib/rental/rental-listing-auto-create'
import {
  RENTAL_LISTING_INGEST_DRAFT_VERSION,
  type RentalListingIngestDraftPayloadV1,
} from '@/lib/rental/rental-listing-ingest-draft-types'
import { runAdminListingIngest } from '@/lib/rental/listing-ingest-orchestrator'
import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BULK_MAX_URLS = 30
const CONTACT_PREFIX = 'Bulk-URL-Import (Admin)'

function parseUrlsFromBody(body: { urls?: unknown; text?: unknown }): { urls: string[]; truncated: boolean } {
  const seen = new Set<string>()
  const ordered: string[] = []
  const consider = (s: string) => {
    const t = s.trim()
    if (!t) return
    const low = t.toLowerCase()
    if (!low.startsWith('http://') && !low.startsWith('https://')) return
    if (seen.has(t)) return
    seen.add(t)
    ordered.push(t)
  }
  if (Array.isArray(body.urls)) {
    for (const u of body.urls) {
      if (typeof u === 'string') consider(u)
    }
  }
  if (typeof body.text === 'string') {
    for (const line of body.text.split(/\r?\n/)) {
      for (const part of line.split(/[,;]+/)) consider(part)
    }
  }
  const truncated = ordered.length > BULK_MAX_URLS
  return { urls: ordered.slice(0, BULK_MAX_URLS), truncated }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  let body: { urls?: unknown; text?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const { urls, truncated } = parseUrlsFromBody(body)
  if (urls.length === 0) {
    return NextResponse.json(
      { message: 'Keine gültigen http(s)-URLs — eine pro Zeile oder als Liste (Komma).' },
      { status: 400 }
    )
  }

  const results: Array<
    | { url: string; ok: true; listingId: string }
    | { url: string; ok: false; draftId: string; reason: string }
  > = []

  for (const rawUrl of urls) {
    let safeUrl: string
    try {
      safeUrl = (await assertUrlSafeForServerFetch(rawUrl)).toString()
    } catch {
      const msg = 'URL ungültig oder nicht erlaubt (SSR-Sicherheitsprüfung).'
      const payload: RentalListingIngestDraftPayloadV1 = {
        version: RENTAL_LISTING_INGEST_DRAFT_VERSION,
        kind: 'url_invalid',
        sourceUrl: rawUrl.trim().slice(0, 4000),
        message: msg,
      }
      const row = await prisma.rentalListingIngestDraft.create({
        data: {
          createdByUserId: session.user.id,
          sourceUrl: rawUrl.trim().slice(0, 4000),
          lastError: msg,
          draftPayload: payload as object,
        },
      })
      results.push({ url: rawUrl.trim(), ok: false, draftId: row.id, reason: msg })
      continue
    }

    let orchestrator: Awaited<ReturnType<typeof runAdminListingIngest>>
    try {
      orchestrator = await runAdminListingIngest(session.user.id, { mode: 'url', url: safeUrl })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ingest-Fehler'
      const payload: RentalListingIngestDraftPayloadV1 = {
        version: RENTAL_LISTING_INGEST_DRAFT_VERSION,
        kind: 'url_invalid',
        sourceUrl: safeUrl,
        message: msg,
      }
      const row = await prisma.rentalListingIngestDraft.create({
        data: {
          createdByUserId: session.user.id,
          sourceUrl: safeUrl.slice(0, 4000),
          lastError: msg,
          draftPayload: payload as object,
        },
      })
      results.push({ url: safeUrl, ok: false, draftId: row.id, reason: msg })
      continue
    }

    const created = await createRentalListingFromIngestOrchestrator({
      adminUserId: session.user.id,
      ingest: orchestrator,
      sourceUrl: safeUrl,
      contactPrefixLine: CONTACT_PREFIX,
    })

    if (!created.ok) {
      const payload: RentalListingIngestDraftPayloadV1 = {
        version: RENTAL_LISTING_INGEST_DRAFT_VERSION,
        kind: 'orchestrator',
        sourceUrl: safeUrl,
        orchestrator,
      }
      const row = await prisma.rentalListingIngestDraft.create({
        data: {
          createdByUserId: session.user.id,
          sourceUrl: safeUrl.slice(0, 4000),
          lastError: created.reason,
          draftPayload: payload as object,
        },
      })
      results.push({ url: safeUrl, ok: false, draftId: row.id, reason: created.reason })
      continue
    }

    results.push({ url: safeUrl, ok: true, listingId: created.listingId })
  }

  const okCount = results.filter(r => r.ok).length
  const failCount = results.length - okCount

  return NextResponse.json({
    results,
    summary: { total: results.length, created: okCount, drafts: failCount, truncated },
  })
}
