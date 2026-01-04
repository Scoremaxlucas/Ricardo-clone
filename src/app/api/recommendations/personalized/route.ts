import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RICARDO-LEVEL: Personalized Recommendations API
 *
 * Analyzes user behavior to provide personalized product recommendations:
 * - Browsing history (recently viewed)
 * - Favorites
 * - Purchase history (similar to purchased items)
 * - Saved searches
 * - Category preferences
 */

export const dynamic = 'force-dynamic'

interface RecommendedWatch {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  images: string
  condition: string
  isAuction: boolean
  auctionEnd: Date | null
  createdAt: Date
  sellerId: string
  recommendationType: 'browsing' | 'favorites' | 'purchases' | 'category' | 'trending'
  recommendationReason: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 30)
    const type = searchParams.get('type') // 'all', 'browsing', 'favorites', 'purchases', 'trending'

    // If no user session, return trending items
    if (!session?.user?.id) {
      return await getTrendingRecommendations(limit)
    }

    const userId = session.user.id
    const recommendations: RecommendedWatch[] = []

    // 1. Recently viewed items (Browsing History)
    if (type === 'all' || type === 'browsing') {
      try {
        const recentlyViewed = await prisma.browsingHistory.findMany({
          where: { userId },
          orderBy: { viewedAt: 'desc' },
          take: 10,
          select: {
            watch: {
              select: {
                id: true,
                brand: true,
                price: true,
                categories: {
                  select: {
                    category: {
                      select: { slug: true },
                    },
                  },
                },
              },
            },
          },
        })

        // Get similar items to recently viewed
        if (recentlyViewed.length > 0) {
          const viewedBrands = Array.from(
            new Set(recentlyViewed.map(v => v.watch?.brand).filter(Boolean))
          )
          const priceRange = {
            min: Math.min(...recentlyViewed.map(v => v.watch?.price || 0)) * 0.7,
            max: Math.max(...recentlyViewed.map(v => v.watch?.price || 0)) * 1.3,
          }
          const viewedIds = recentlyViewed.map(v => v.watch?.id).filter(Boolean) as string[]
          const viewedCategories = Array.from(
            new Set(
              recentlyViewed.flatMap(v => v.watch?.categories?.map(c => c.category?.slug) || [])
            )
          )

          const similarToViewed = await prisma.watch.findMany({
            where: {
              AND: [
                { id: { notIn: viewedIds } },
                { sellerId: { not: userId } },
                { moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] } },
                {
                  OR: [
                    { brand: { in: viewedBrands as string[] } },
                    { price: { gte: priceRange.min, lte: priceRange.max } },
                  ],
                },
                {
                  OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
                },
              ],
            },
            select: {
              id: true,
              title: true,
              brand: true,
              model: true,
              price: true,
              buyNowPrice: true,
              images: true,
              condition: true,
              isAuction: true,
              auctionEnd: true,
              createdAt: true,
              sellerId: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Math.ceil(limit / 3),
          })

          for (const watch of similarToViewed) {
            recommendations.push({
              ...watch,
              recommendationType: 'browsing',
              recommendationReason: 'Basierend auf Ihrem Suchverlauf',
            })
          }
        }
      } catch (err) {
        console.error('Error fetching browsing-based recommendations:', err)
      }
    }

    // 2. Based on favorites
    if (type === 'all' || type === 'favorites') {
      try {
        const favorites = await prisma.favorite.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            watch: {
              select: {
                id: true,
                brand: true,
                price: true,
                categories: {
                  select: {
                    category: {
                      select: { slug: true },
                    },
                  },
                },
              },
            },
          },
        })

        if (favorites.length > 0) {
          const favBrands = Array.from(
            new Set(favorites.map(f => f.watch?.brand).filter(Boolean))
          )
          const favIds = favorites.map(f => f.watch?.id).filter(Boolean) as string[]
          const priceRange = {
            min: Math.min(...favorites.map(f => f.watch?.price || 0)) * 0.7,
            max: Math.max(...favorites.map(f => f.watch?.price || 0)) * 1.3,
          }

          const similarToFavorites = await prisma.watch.findMany({
            where: {
              AND: [
                { id: { notIn: [...favIds, ...recommendations.map(r => r.id)] } },
                { sellerId: { not: userId } },
                { moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] } },
                {
                  OR: [
                    { brand: { in: favBrands as string[] } },
                    { price: { gte: priceRange.min, lte: priceRange.max } },
                  ],
                },
                {
                  OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
                },
              ],
            },
            select: {
              id: true,
              title: true,
              brand: true,
              model: true,
              price: true,
              buyNowPrice: true,
              images: true,
              condition: true,
              isAuction: true,
              auctionEnd: true,
              createdAt: true,
              sellerId: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Math.ceil(limit / 3),
          })

          for (const watch of similarToFavorites) {
            recommendations.push({
              ...watch,
              recommendationType: 'favorites',
              recommendationReason: 'Ähnlich wie Ihre Favoriten',
            })
          }
        }
      } catch (err) {
        console.error('Error fetching favorites-based recommendations:', err)
      }
    }

    // 3. Based on purchases
    if (type === 'all' || type === 'purchases') {
      try {
        const purchases = await prisma.purchase.findMany({
          where: { buyerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            watch: {
              select: {
                id: true,
                brand: true,
                price: true,
                categories: {
                  select: {
                    category: {
                      select: { slug: true },
                    },
                  },
                },
              },
            },
          },
        })

        if (purchases.length > 0) {
          const purchasedBrands = Array.from(
            new Set(purchases.map(p => p.watch?.brand).filter(Boolean))
          )
          const purchasedIds = purchases.map(p => p.watch?.id).filter(Boolean) as string[]

          const similarToPurchases = await prisma.watch.findMany({
            where: {
              AND: [
                { id: { notIn: [...purchasedIds, ...recommendations.map(r => r.id)] } },
                { sellerId: { not: userId } },
                { moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] } },
                { brand: { in: purchasedBrands as string[] } },
                {
                  OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
                },
              ],
            },
            select: {
              id: true,
              title: true,
              brand: true,
              model: true,
              price: true,
              buyNowPrice: true,
              images: true,
              condition: true,
              isAuction: true,
              auctionEnd: true,
              createdAt: true,
              sellerId: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Math.ceil(limit / 4),
          })

          for (const watch of similarToPurchases) {
            recommendations.push({
              ...watch,
              recommendationType: 'purchases',
              recommendationReason: 'Könnte Ihnen auch gefallen',
            })
          }
        }
      } catch (err) {
        console.error('Error fetching purchase-based recommendations:', err)
      }
    }

    // 4. Fill remaining with trending items
    const remaining = limit - recommendations.length
    if (remaining > 0) {
      try {
        const trending = await prisma.watch.findMany({
          where: {
            AND: [
              { id: { notIn: recommendations.map(r => r.id) } },
              { sellerId: { not: userId } },
              { moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] } },
              {
                OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            price: true,
            buyNowPrice: true,
            images: true,
            condition: true,
            isAuction: true,
            auctionEnd: true,
            createdAt: true,
            sellerId: true,
            productStats: {
              select: { viewCount: true, favoriteCount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: remaining * 2, // Get more and sort by engagement
        })

        // Sort by engagement (views + favorites)
        const sortedTrending = trending
          .map(w => ({
            ...w,
            engagement: (w.productStats?.viewCount || 0) + (w.productStats?.favoriteCount || 0) * 3,
          }))
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, remaining)

        for (const watch of sortedTrending) {
          const { productStats, engagement, ...watchData } = watch
          recommendations.push({
            ...watchData,
            recommendationType: 'trending',
            recommendationReason: 'Beliebt bei anderen Nutzern',
          })
        }
      } catch (err) {
        console.error('Error fetching trending recommendations:', err)
      }
    }

    // Format response
    const formattedRecommendations = recommendations.map(w => {
      let images: string[] = []
      try {
        images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images || []
      } catch {}

      return {
        id: w.id,
        title: w.title,
        brand: w.brand,
        model: w.model,
        price: Number(w.price),
        buyNowPrice: w.buyNowPrice ? Number(w.buyNowPrice) : null,
        images,
        condition: w.condition,
        isAuction: w.isAuction,
        auctionEnd: w.auctionEnd,
        createdAt: w.createdAt,
        sellerId: w.sellerId,
        recommendationType: w.recommendationType,
        recommendationReason: w.recommendationReason,
      }
    })

    return NextResponse.json({
      recommendations: formattedRecommendations,
      total: formattedRecommendations.length,
      personalized: true,
    })
  } catch (error) {
    console.error('[RECOMMENDATIONS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations', recommendations: [], personalized: false },
      { status: 500 }
    )
  }
}

// Fallback for non-authenticated users
async function getTrendingRecommendations(limit: number) {
  try {
    const trending = await prisma.watch.findMany({
      where: {
        moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] },
        OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        buyNowPrice: true,
        images: true,
        condition: true,
        isAuction: true,
        auctionEnd: true,
        createdAt: true,
        sellerId: true,
        productStats: {
          select: { viewCount: true, favoriteCount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    })

    // Sort by engagement
    const sorted = trending
      .map(w => ({
        ...w,
        engagement: (w.productStats?.viewCount || 0) + (w.productStats?.favoriteCount || 0) * 3,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit)

    const recommendations = sorted.map(w => {
      let images: string[] = []
      try {
        images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images || []
      } catch {}

      return {
        id: w.id,
        title: w.title,
        brand: w.brand,
        model: w.model,
        price: Number(w.price),
        buyNowPrice: w.buyNowPrice ? Number(w.buyNowPrice) : null,
        images,
        condition: w.condition,
        isAuction: w.isAuction,
        auctionEnd: w.auctionEnd,
        createdAt: w.createdAt,
        sellerId: w.sellerId,
        recommendationType: 'trending' as const,
        recommendationReason: 'Beliebt auf Helvenda',
      }
    })

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
      personalized: false,
    })
  } catch (error) {
    console.error('[RECOMMENDATIONS] Trending error:', error)
    return NextResponse.json({
      recommendations: [],
      total: 0,
      personalized: false,
    })
  }
}
