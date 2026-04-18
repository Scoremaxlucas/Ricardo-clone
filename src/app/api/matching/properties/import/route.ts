import { MatchPropertySource } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { bulkImportMatchingPropertiesFromJsonItems } from '@/lib/matching/bulk-import-matching-properties'
import { matchingApiImportBodySchema } from '@/lib/matching/matching-api-import-schema'
import {
  completeMatchingOutboxJob,
  createMatchingOutboxJob,
  failMatchingOutboxJob,
} from '@/lib/matching/matching-outbox'
import {
  checkMatchingImportPostIpRateLimit,
  checkMatchingImportPostUserRateLimit,
} from '@/lib/matching/matching-rate-limit'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

async function getAuthorizedImportUserId(request: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return session.user.id

  const secret = process.env.MATCHING_IMPORT_API_SECRET
  const feedUserId = process.env.MATCHING_IMPORT_USER_ID
  if (!secret || !feedUserId) return null

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token || token !== secret) return null

  return feedUserId
}

/**
 * POST /api/matching/properties/import
 * Body: { "items": [ { …wizard fields… }, … ] } — strikt validiert, ohne Zusatzfelder.
 * Auth: Session oder Bearer-Token (siehe MATCHING_IMPORT_*).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthorizedImportUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Nicht autorisiert (Session oder gültiger Import-Bearer).' },
        { status: 401 }
      )
    }

    const rlUser = await checkMatchingImportPostUserRateLimit(userId)
    if (!rlUser.allowed) {
      const retry = Math.max(1, Math.ceil((rlUser.resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        { message: 'Zu viele Import-Anfragen für dieses Konto.', retryAfter: retry },
        { status: 429, headers: { 'Retry-After': String(retry) } }
      )
    }

    const ip = clientIp(request)
    const rlIp = await checkMatchingImportPostIpRateLimit(ip)
    if (!rlIp.allowed) {
      const retry = Math.max(1, Math.ceil((rlIp.resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        { message: 'Zu viele Import-Anfragen von dieser Adresse.', retryAfter: retry },
        { status: 429, headers: { 'Retry-After': String(retry) } }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Ungültiges JSON' }, { status: 400 })
    }

    const parsed = matchingApiImportBodySchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 8)
      return NextResponse.json({ message: 'Validierung fehlgeschlagen.', details: msg }, { status: 400 })
    }

    const items = parsed.data.items

    const job = await createMatchingOutboxJob({
      type: 'matching.import.api',
      payload: { userId, itemCount: items.length } as unknown as Prisma.InputJsonValue,
    })

    try {
      const { createdIds, errors } = await bulkImportMatchingPropertiesFromJsonItems({
        userId,
        items,
        source: MatchPropertySource.api,
      })

      await completeMatchingOutboxJob(job.id, {
        userId,
        itemCount: items.length,
        created: createdIds.length,
        errorRows: errors.length,
      } as unknown as Prisma.InputJsonValue)

      return NextResponse.json({
        created: createdIds.length,
        propertyIds: createdIds,
        errors,
        jobId: job.id,
      })
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      await failMatchingOutboxJob(job.id, err)
      console.error('[POST /api/matching/properties/import]', e)
      return NextResponse.json({ message: 'Import fehlgeschlagen', jobId: job.id }, { status: 500 })
    }
  } catch (e) {
    console.error('[POST /api/matching/properties/import]', e)
    return NextResponse.json({ message: 'Serverfehler' }, { status: 500 })
  }
}
