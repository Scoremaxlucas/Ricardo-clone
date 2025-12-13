/**
 * Recommendation Engine
 * Feature 5: Personalisierung - KI-basierte Produktempfehlungen
 */

import { prisma } from './prisma'

export interface RecommendationOptions {
  userId: string
  limit?: number
  excludeWatchIds?: string[]
}

export interface RecommendedProduct {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
  score: number // Relevanz-Score (0-1)
  reason: string // Warum wurde es empfohlen
}

/**
 * Content-Based Filtering: Empfiehlt ähnliche Produkte basierend auf Eigenschaften
 */
async function contentBasedRecommendations(
  userId: string,
  limit: number = 10
): Promise<RecommendedProduct[]> {
  try {
    // Hole Browsing-History
    const history = await prisma.browsingHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 20,
      include: {
        watch: true,
      },
    })

    if (history.length === 0) {
      return []
    }

    // Analysiere häufig angesehene Marken, Preis-Range
    const brands = new Map<string, number>()
    const prices: number[] = []

    history.forEach(item => {
      if (item.watch.brand) {
        brands.set(item.watch.brand, (brands.get(item.watch.brand) || 0) + 1)
      }
      if (item.watch.price) {
        prices.push(item.watch.price)
      }
    })

    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const priceRange = {
      min: avgPrice * 0.5,
      max: avgPrice * 1.5,
    }

    // Finde ähnliche Produkte
    const topBrands = Array.from(brands.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand)

    const similarProducts = await prisma.watch.findMany({
      where: {
        AND: [
          {
            OR: topBrands.map(brand => ({ brand })),
          },
          {
            price: {
              gte: priceRange.min,
              lte: priceRange.max,
            },
          },
          {
            id: {
              notIn: history.map(h => h.watchId),
            },
          },
        ],
      },
      take: limit,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    return similarProducts.map(product => ({
      id: product.id,
      title: product.title,
      brand: product.brand,
      price: product.price,
      images: product.images ? JSON.parse(product.images) : [],
      score: 0.7, // Content-based Score
      reason: `Ähnlich zu deinen bisherigen Suchen`,
    }))
  } catch (error) {
    console.error('Error in content-based recommendations:', error)
    return []
  }
}

/**
 * Collaborative Filtering: Empfiehlt basierend auf ähnlichen Usern
 */
async function collaborativeRecommendations(
  userId: string,
  limit: number = 10
): Promise<RecommendedProduct[]> {
  try {
    // Hole User-Favorites
    const userFavorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        watch: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (userFavorites.length === 0) {
      return []
    }

    // Finde andere User mit ähnlichen Favorites
    const favoriteWatchIds = userFavorites.map(f => f.watchId)

    const similarUsers = await prisma.favorite.findMany({
      where: {
        watchId: {
          in: favoriteWatchIds,
        },
        userId: {
          not: userId,
        },
      },
      select: {
        userId: true,
        watchId: true,
      },
    })

    // Zähle wie oft jeder User ähnliche Favorites hat
    const userSimilarity = new Map<string, number>()
    similarUsers.forEach(item => {
      userSimilarity.set(item.userId, (userSimilarity.get(item.userId) || 0) + 1)
    })

    // Hole Favorites von ähnlichen Usern
    const topSimilarUsers = Array.from(userSimilarity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId]) => userId)

    const recommendedFavorites = await prisma.favorite.findMany({
      where: {
        userId: {
          in: topSimilarUsers,
        },
        watchId: {
          notIn: favoriteWatchIds,
        },
      },
      include: {
        watch: true,
      },
      take: limit,
    })

    return recommendedFavorites.map(item => ({
      id: item.watch.id,
      title: item.watch.title,
      brand: item.watch.brand,
      price: item.watch.price,
      images: item.watch.images ? JSON.parse(item.watch.images) : [],
      score: 0.8, // Collaborative Score
      reason: `Beliebt bei Nutzern mit ähnlichen Interessen`,
    }))
  } catch (error) {
    console.error('Error in collaborative recommendations:', error)
    return []
  }
}

/**
 * Hybrid Recommendation: Kombiniert Content-Based und Collaborative Filtering
 */
export async function getPersonalizedRecommendations(
  options: RecommendationOptions
): Promise<RecommendedProduct[]> {
  const { userId, limit = 10, excludeWatchIds = [] } = options

  try {
    // Hole beide Empfehlungstypen
    const [contentBased, collaborative] = await Promise.all([
      contentBasedRecommendations(userId, limit),
      collaborativeRecommendations(userId, limit),
    ])

    // Kombiniere und dedupliziere
    const combined = new Map<string, RecommendedProduct>()

    // Füge Content-Based hinzu (Gewichtung: 0.6)
    contentBased.forEach(product => {
      if (!excludeWatchIds.includes(product.id)) {
        combined.set(product.id, {
          ...product,
          score: product.score * 0.6,
        })
      }
    })

    // Füge Collaborative hinzu (Gewichtung: 0.4)
    collaborative.forEach(product => {
      if (!excludeWatchIds.includes(product.id)) {
        const existing = combined.get(product.id)
        if (existing) {
          // Kombiniere Scores wenn beide vorhanden
          existing.score = existing.score + product.score * 0.4
          existing.reason = `${existing.reason} und ${product.reason}`
        } else {
          combined.set(product.id, {
            ...product,
            score: product.score * 0.4,
          })
        }
      }
    })

    // Sortiere nach Score und gebe Top-Ergebnisse zurück
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting personalized recommendations:', error)
    return []
  }
}

/**
 * Aktualisiert User-Präferenzen basierend auf Browsing-History
 */
export async function updateUserPreferences(userId: string): Promise<void> {
  try {
    const history = await prisma.browsingHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 100,
      include: {
        watch: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (history.length === 0) {
      return
    }

    // Analysiere Präferenzen
    const categories = new Map<string, number>()
    const brands = new Map<string, number>()
    const prices: number[] = []
    const conditions = new Map<string, number>()

    history.forEach(item => {
      item.watch.categories.forEach(wc => {
        categories.set(wc.category.slug, (categories.get(wc.category.slug) || 0) + 1)
      })
      if (item.watch.brand) {
        brands.set(item.watch.brand, (brands.get(item.watch.brand) || 0) + 1)
      }
      if (item.watch.price) {
        prices.push(item.watch.price)
      }
      if (item.watch.condition) {
        conditions.set(item.watch.condition, (conditions.get(item.watch.condition) || 0) + 1)
      }
    })

    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug]) => slug)

    const topBrands = Array.from(brands.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand]) => brand)

    const topConditions = Array.from(conditions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([condition]) => condition)

    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const priceRange = {
      min: Math.max(0, avgPrice * 0.5),
      max: avgPrice * 1.5,
    }

    // Speichere Präferenzen
    await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        preferredCategories: JSON.stringify(topCategories),
        priceRange: JSON.stringify(priceRange),
        preferredBrands: JSON.stringify(topBrands),
        preferredConditions: JSON.stringify(topConditions),
      },
      update: {
        preferredCategories: JSON.stringify(topCategories),
        priceRange: JSON.stringify(priceRange),
        preferredBrands: JSON.stringify(topBrands),
        preferredConditions: JSON.stringify(topConditions),
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)
  }
}
