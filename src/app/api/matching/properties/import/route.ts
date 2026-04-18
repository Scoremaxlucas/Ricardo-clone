import { MatchPropertySource } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { bulkImportMatchingPropertiesFromJsonItems } from '@/lib/matching/bulk-import-matching-properties'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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
 * Body: { "items": [ { …wizard fields… }, … ] }
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Ungültiges JSON' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || !('items' in body)) {
      return NextResponse.json({ message: 'Body muss { items: [] } enthalten.' }, { status: 400 })
    }

    const items = (body as { items: unknown }).items
    if (!Array.isArray(items)) {
      return NextResponse.json({ message: 'items muss ein Array sein.' }, { status: 400 })
    }

    if (items.length > 500) {
      return NextResponse.json({ message: 'Maximal 500 Einträge pro Anfrage.' }, { status: 400 })
    }

    const { createdIds, errors } = await bulkImportMatchingPropertiesFromJsonItems({
      userId,
      items,
      source: MatchPropertySource.api,
    })

    return NextResponse.json({
      created: createdIds.length,
      propertyIds: createdIds,
      errors,
    })
  } catch (e) {
    console.error('[POST /api/matching/properties/import]', e)
    return NextResponse.json({ message: 'Serverfehler' }, { status: 500 })
  }
}
