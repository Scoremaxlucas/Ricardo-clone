import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { authOptions } from '@/lib/auth'
import { getPopularSearches, getSearchSuggestions } from '@/lib/search-analytics'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Suchvorschläge (Feature 1: Intelligente Suchleiste)
 *
 * GET /api/search/suggestions?q=...&limit=...
 *
 * Gibt Suchvorschläge basierend auf Teilstring zurück
 * Falls kein Query-Parameter, gibt populäre Suchbegriffe zurück
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Session für User-ID (optional)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // API-Level Cache für vollständige Response
    const cacheKey = generateCacheKey('/api/search/suggestions', { q: query, limit })
    const cachedResponse = apiCache.get<{ suggestions: string[]; query: string; count: number }>(
      cacheKey
    )

    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      })
    }

    let suggestions: string[] = []

    if (query.trim().length > 0) {
      // Wenn Query vorhanden, hole Vorschläge basierend auf Teilstring
      // Mindestens 2 Zeichen für sinnvolle Vorschläge
      if (query.trim().length >= 2) {
        suggestions = await getSearchSuggestions(query.trim(), limit)
      }
    } else {
      // Wenn kein Query, hole populäre Suchbegriffe
      suggestions = await getPopularSearches(limit)
    }

    const response = {
      suggestions,
      query: query.trim(),
      count: suggestions.length,
    }

    // Cache API Response für 1 Minute (60000ms)
    // Die Funktionen getPopularSearches/getSearchSuggestions haben bereits
    // ihr eigenes Caching, aber API-Level Caching reduziert zusätzliche Overhead
    apiCache.set(cacheKey, response, 60000)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: any) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      {
        suggestions: [],
        query: '',
        count: 0,
        error: 'Error fetching suggestions',
      },
      { status: 500 }
    )
  }
}
