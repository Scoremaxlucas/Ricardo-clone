import { authOptions } from '@/lib/auth'
import { trackSearchQuery } from '@/lib/search-analytics'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Search Analytics Tracking (Feature 1)
 *
 * POST /api/search/track
 *
 * Trackt Suchanfragen für Analytics und Empfehlungen
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, userId, category, resultCount } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Session für User-ID (falls nicht übergeben)
    const session = await getServerSession(authOptions)
    const finalUserId = userId || session?.user?.id || null

    // Track search query
    await trackSearchQuery({
      query: query.trim(),
      userId: finalUserId || undefined,
      category: category || undefined,
      resultCount: resultCount || 0,
      clicked: false,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error tracking search query:', error)
    return NextResponse.json({ error: 'Error tracking search query' }, { status: 500 })
  }
}
