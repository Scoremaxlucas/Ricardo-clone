/**
 * Product Statistics Utility
 * Feature 2: Social Proof - Helper functions for product statistics
 */

import { prisma } from './prisma'

/**
 * Trackt einen View für ein Produkt (Server-Side)
 */
export async function trackProductView(watchId: string): Promise<void> {
  try {
    // Hole oder erstelle ProductStats Eintrag
    let stats = await prisma.productStats.findUnique({
      where: { watchId },
    })

    if (!stats) {
      // Berechne initiale Werte
      const favoriteCount = await prisma.favorite.count({
        where: { watchId },
      })

      stats = await prisma.productStats.create({
        data: {
          watchId,
          favoriteCount,
          viewCount: 0,
          soldLast24h: 0,
          viewersNow: 0,
        },
      })
    }

    // Inkrementiere viewCount
    await prisma.productStats.update({
      where: { watchId },
      data: {
        viewCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    })
  } catch (error) {
    // Silent fail - Analytics sollten nicht die Hauptfunktionalität blockieren
    console.error('Error tracking product view:', error)
  }
}

/**
 * Aktualisiert die Favoriten-Anzahl für ein Produkt
 */
export async function updateFavoriteCount(watchId: string): Promise<void> {
  try {
    const favoriteCount = await prisma.favorite.count({
      where: { watchId },
    })

    await prisma.productStats.upsert({
      where: { watchId },
      update: {
        favoriteCount,
        lastUpdated: new Date(),
      },
      create: {
        watchId,
        favoriteCount,
        viewCount: 0,
        soldLast24h: 0,
        viewersNow: 0,
      },
    })
  } catch (error) {
    console.error('Error updating favorite count:', error)
  }
}

/**
 * Aktualisiert die "soldLast24h" Statistik
 */
export async function updateSoldLast24h(watchId: string): Promise<void> {
  try {
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const soldLast24h = await prisma.purchase.count({
      where: {
        watchId,
        createdAt: { gte: yesterday },
        status: { not: 'cancelled' },
      },
    })

    await prisma.productStats.upsert({
      where: { watchId },
      update: {
        soldLast24h,
        lastUpdated: new Date(),
      },
      create: {
        watchId,
        favoriteCount: 0,
        viewCount: 0,
        soldLast24h,
        viewersNow: 0,
      },
    })
  } catch (error) {
    console.error('Error updating soldLast24h:', error)
  }
}
