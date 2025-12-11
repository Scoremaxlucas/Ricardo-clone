import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSearchSuggestions, getPopularSearches } from '@/lib/search-analytics'

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

    return NextResponse.json({
      suggestions,
      query: query.trim(),
      count: suggestions.length,
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
