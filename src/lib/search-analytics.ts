/**
 * Search Analytics Utility
 * Feature 1: Intelligente Suche - Tracking und Analytics für Suchanfragen
 */

import { apiCache } from './api-cache'
import { prisma } from './prisma'

export interface SearchQueryData {
  query: string
  userId?: string
  category?: string
  resultCount: number
  clicked?: boolean
  clickedWatchId?: string
}

/**
 * Speichert eine Suchanfrage für Analytics
 */
export async function trackSearchQuery(data: SearchQueryData): Promise<void> {
  try {
    await prisma.searchQuery.create({
      data: {
        query: data.query,
        userId: data.userId || null,
        category: data.category || null,
        resultCount: data.resultCount,
        clicked: data.clicked || false,
        clickedWatchId: data.clickedWatchId || null,
      },
    })
  } catch (error) {
    // Silent fail - Analytics sollten nicht die Hauptfunktionalität blockieren
    console.error('Error tracking search query:', error)
  }
}

/**
 * Holt beliebte Suchanfragen für Auto-Complete
 * Cached für 5 Minuten für bessere Performance
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  try {
    // Cache-Key basierend auf Limit
    const cacheKey = `popular-searches:${limit}`
    const cached = apiCache.get<string[]>(cacheKey)

    if (cached) {
      return cached
    }

    const popularSearches = await prisma.searchQuery.groupBy({
      by: ['query'],
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: limit,
    })

    const results = popularSearches.map(item => item.query)

    // Cache für 5 Minuten (300000ms)
    apiCache.set(cacheKey, results, 300000)

    return results
  } catch (error) {
    console.error('Error getting popular searches:', error)
    return []
  }
}

/**
 * Holt Suchvorschläge basierend auf Teilstring
 * Cached für 2 Minuten für bessere Performance bei häufigen Anfragen
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5
): Promise<string[]> {
  try {
    // Cache-Key basierend auf Query und Limit
    const normalizedQuery = partialQuery.toLowerCase().trim()
    const cacheKey = `search-suggestions:${normalizedQuery}:${limit}`
    const cached = apiCache.get<string[]>(cacheKey)

    if (cached) {
      return cached
    }

    const suggestions = await prisma.searchQuery.findMany({
      where: {
        query: {
          contains: partialQuery,
          mode: 'insensitive',
        },
      },
      select: {
        query: true,
      },
      distinct: ['query'],
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const results = suggestions.map(item => item.query)

    // Cache für 2 Minuten (120000ms) - kürzer als populäre Suchbegriffe,
    // da Teilstring-Suchen häufiger variieren
    apiCache.set(cacheKey, results, 120000)

    return results
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return []
  }
}

/**
 * Markiert eine Suche als geklickt
 */
export async function markSearchAsClicked(queryId: string, watchId: string): Promise<void> {
  try {
    await prisma.searchQuery.update({
      where: { id: queryId },
      data: {
        clicked: true,
        clickedWatchId: watchId,
      },
    })
  } catch (error) {
    console.error('Error marking search as clicked:', error)
  }
}
