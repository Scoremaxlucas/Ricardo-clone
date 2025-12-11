/**
 * Search Analytics Utility
 * Feature 1: Intelligente Suche - Tracking und Analytics für Suchanfragen
 */

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
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  try {
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

    return popularSearches.map(item => item.query)
  } catch (error) {
    console.error('Error getting popular searches:', error)
    return []
  }
}

/**
 * Holt Suchvorschläge basierend auf Teilstring
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5
): Promise<string[]> {
  try {
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

    return suggestions.map(item => item.query)
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
