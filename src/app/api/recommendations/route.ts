import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { authOptions } from '@/lib/auth'
import {
  getUserBrowsingHistory,
  getUserPreferredBrands,
  getUserPreferredCategories,
  getUserPriceRange,
} from '@/lib/browsing-tracker'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für personalisierte Empfehlungen (Feature 5: Personalisierung)
 *
 * GET /api/recommendations?limit=10
 *
 * Gibt personalisierte Produkt-Empfehlungen basierend auf:
 * - Browsing-Historie
 * - User-Präferenzen
 * - Ähnliche Käufer (Collaborative Filtering)
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      // Für nicht-angemeldete User: Gib beliebte Produkte zurück
      const popularWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      return NextResponse.json({ watches: popularWatches, reason: 'popular' })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Check cache first
    const cacheKey = generateCacheKey('/api/recommendations', { userId, limit })
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    // Hole Browsing-Historie und Präferenzen
    const [history, categories, brands, priceRange] = await Promise.all([
      getUserBrowsingHistory(userId, 50),
      getUserPreferredCategories(userId),
      getUserPreferredBrands(userId),
      getUserPriceRange(userId),
    ])

    // Wenn keine Historie vorhanden, gib beliebte Produkte zurück
    if (history.length === 0) {
      const popularWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      const response = { watches: popularWatches, reason: 'popular' }
      apiCache.set(cacheKey, response, 300000) // Cache für 5 Minuten
      return NextResponse.json(response)
    }

    // Hole bereits angesehene Produkt-IDs (um Duplikate zu vermeiden)
    const viewedWatchIds = new Set(history.map(h => h.watchId))

    // Strategie 1: Empfehle Produkte aus bevorzugten Kategorien
    let recommendedWatches: any[] = []

    if (categories.length > 0) {
      const categoryWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
          id: { notIn: Array.from(viewedWatchIds) },
          categories: {
            some: {
              category: {
                slug: { in: categories },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      recommendedWatches.push(...categoryWatches)
    }

    // Strategie 2: Empfehle Produkte von bevorzugten Marken
    if (brands.length > 0 && recommendedWatches.length < limit) {
      const brandWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
          id: { notIn: [...Array.from(viewedWatchIds), ...recommendedWatches.map(w => w.id)] },
          brand: { in: brands },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit - recommendedWatches.length,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      recommendedWatches.push(...brandWatches)
    }

    // Strategie 3: Empfehle Produkte im bevorzugten Preisbereich
    if (priceRange && recommendedWatches.length < limit) {
      const priceWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
          id: { notIn: [...Array.from(viewedWatchIds), ...recommendedWatches.map(w => w.id)] },
          price: {
            gte: priceRange.min * 0.8, // 20% unter Minimum
            lte: priceRange.max * 1.2, // 20% über Maximum
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit - recommendedWatches.length,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      recommendedWatches.push(...priceWatches)
    }

    // Strategie 4: Collaborative Filtering - Finde ähnliche Käufer
    if (recommendedWatches.length < limit) {
      // Finde User, die ähnliche Produkte angesehen haben
      const similarUserIds = await prisma.browsingHistory.findMany({
        where: {
          watchId: { in: Array.from(viewedWatchIds) },
          userId: { not: userId },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
        take: 10,
      })

      if (similarUserIds.length > 0) {
        const similarUserIdsList = similarUserIds
          .map(u => u.userId)
          .filter((id): id is string => id !== null)

        // Finde Produkte, die ähnliche User angesehen haben, aber dieser User noch nicht
        const collaborativeWatches = await prisma.browsingHistory.findMany({
          where: {
            userId: { in: similarUserIdsList },
            watchId: {
              notIn: [...Array.from(viewedWatchIds), ...recommendedWatches.map(w => w.id)],
            },
            watch: {
              moderationStatus: 'approved',
            },
          },
          select: {
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                price: true,
                images: true,
                createdAt: true,
              },
            },
          },
          distinct: ['watchId'],
          take: limit - recommendedWatches.length,
          orderBy: {
            viewedAt: 'desc',
          },
        })

        recommendedWatches.push(...collaborativeWatches.map(c => c.watch))
      }
    }

    // Falls immer noch nicht genug: Fülle mit beliebten Produkten auf
    if (recommendedWatches.length < limit) {
      const popularWatches = await prisma.watch.findMany({
        where: {
          moderationStatus: 'approved',
          id: { notIn: [...Array.from(viewedWatchIds), ...recommendedWatches.map(w => w.id)] },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit - recommendedWatches.length,
        select: {
          id: true,
          title: true,
          brand: true,
          price: true,
          images: true,
          createdAt: true,
        },
      })

      recommendedWatches.push(...popularWatches)
    }

    // Entferne Duplikate und begrenze auf limit
    const uniqueWatches = Array.from(
      new Map(recommendedWatches.map(w => [w.id, w])).values()
    ).slice(0, limit)

    const response = {
      watches: uniqueWatches,
      reason: history.length > 0 ? 'personalized' : 'popular',
      basedOn: {
        categories: categories.length > 0,
        brands: brands.length > 0,
        priceRange: priceRange !== null,
        collaborativeFiltering: recommendedWatches.length > categories.length + brands.length,
      },
    }

    // Cache für 5 Minuten
    apiCache.set(cacheKey, response, 300000)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Empfehlungen' }, { status: 500 })
  }
}
