/**
 * Browsing History Tracker
 * Feature 5: Personalisierung - Trackt User-Interaktionen für personalisierte Empfehlungen
 */

import { prisma } from './prisma'

export type BrowsingAction = 'view' | 'favorite' | 'click' | 'purchase'

export interface BrowsingHistoryData {
  userId: string
  watchId: string
  action: BrowsingAction
  duration?: number // Sekunden
}

/**
 * Trackt eine User-Interaktion mit einem Produkt
 */
export async function trackBrowsingHistory(data: BrowsingHistoryData): Promise<void> {
  try {
    await prisma.browsingHistory.create({
      data: {
        userId: data.userId,
        watchId: data.watchId,
        action: data.action,
        duration: data.duration || 0,
        viewedAt: new Date(),
      },
    })
  } catch (error) {
    // Silent fail - Tracking sollte nicht die User-Experience beeinträchtigen
    console.error('[BrowsingTracker] Error tracking history:', error)
  }
}

/**
 * Holt die Browsing-Historie eines Users
 */
export async function getUserBrowsingHistory(
  userId: string,
  limit: number = 50
): Promise<Array<{ watchId: string; action: string; viewedAt: Date }>> {
  try {
    const history = await prisma.browsingHistory.findMany({
      where: { userId },
      select: {
        watchId: true,
        action: true,
        viewedAt: true,
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    })

    return history
  } catch (error) {
    console.error('[BrowsingTracker] Error fetching history:', error)
    return []
  }
}

/**
 * Holt die häufigsten Kategorien aus der Browsing-Historie
 */
export async function getUserPreferredCategories(userId: string): Promise<string[]> {
  try {
    const history = await prisma.browsingHistory.findMany({
      where: { userId },
      select: {
        watch: {
          select: {
            categories: {
              select: {
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 100, // Analysiere letzten 100 Interaktionen
    })

    const categoryCounts = new Map<string, number>()

    for (const entry of history) {
      if (entry.watch?.categories) {
        for (const cat of entry.watch.categories) {
          const slug = cat.category?.slug
          if (slug) {
            categoryCounts.set(slug, (categoryCounts.get(slug) || 0) + 1)
          }
        }
      }
    }

    // Sortiere nach Häufigkeit und gib Top 5 zurück
    return Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug]) => slug)
  } catch (error) {
    console.error('[BrowsingTracker] Error fetching categories:', error)
    return []
  }
}

/**
 * Holt die bevorzugten Marken aus der Browsing-Historie
 */
export async function getUserPreferredBrands(userId: string): Promise<string[]> {
  try {
    const history = await prisma.browsingHistory.findMany({
      where: { userId },
      select: {
        watch: {
          select: {
            brand: true,
          },
        },
      },
      take: 100,
    })

    const brandCounts = new Map<string, number>()

    for (const entry of history) {
      const brand = entry.watch?.brand
      if (brand) {
        brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1)
      }
    }

    return Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand)
  } catch (error) {
    console.error('[BrowsingTracker] Error fetching brands:', error)
    return []
  }
}

/**
 * Berechnet den durchschnittlichen Preisbereich aus der Browsing-Historie
 */
export async function getUserPriceRange(
  userId: string
): Promise<{ min: number; max: number } | null> {
  try {
    const history = await prisma.browsingHistory.findMany({
      where: {
        userId,
        action: { in: ['view', 'favorite', 'purchase'] }, // Nur relevante Aktionen
      },
      select: {
        watch: {
          select: {
            price: true,
          },
        },
      },
      take: 100,
    })

    const prices = history
      .map(entry => entry.watch?.price)
      .filter((p): p is number => p !== undefined && p !== null)

    if (prices.length === 0) {
      return null
    }

    const min = Math.min(...prices)
    const max = Math.max(...prices)

    return { min, max }
  } catch (error) {
    console.error('[BrowsingTracker] Error fetching price range:', error)
    return null
  }
}
