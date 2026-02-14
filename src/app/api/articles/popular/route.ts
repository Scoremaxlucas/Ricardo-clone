import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/articles/popular
 * Returns the most popular articles based on favorites + views
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)

    const now = new Date()

    // Get articles ordered by favoriteCount + viewCount from ProductStats
    const popularStats = await prisma.productStats.findMany({
      where: {
        watch: {
          AND: [
            {
              OR: [
                { moderationStatus: null },
                { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
              ],
            },
            {
              AND: [
                {
                  OR: [
                    { purchases: { none: {} } },
                    { purchases: { every: { status: 'cancelled' } } },
                  ],
                },
                {
                  OR: [
                    { orders: { none: {} } },
                    { orders: { every: { orderStatus: 'canceled' } } },
                  ],
                },
              ],
            },
            {
              OR: [
                { auctionEnd: null },
                { auctionEnd: { gt: now } },
              ],
            },
          ],
        },
      },
      orderBy: [
        { favoriteCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: limit,
      select: {
        watchId: true,
        favoriteCount: true,
        viewCount: true,
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            price: true,
            buyNowPrice: true,
            images: true,
            createdAt: true,
            isAuction: true,
            auctionEnd: true,
            articleNumber: true,
            condition: true,
            paymentProtectionEnabled: true,
            boosters: true,
            seller: {
              select: { id: true },
            },
            bids: {
              select: { amount: true },
              orderBy: { amount: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    // Filter out entries with 0 interactions
    const filtered = popularStats.filter(s => s.favoriteCount > 0 || s.viewCount > 0)

    // If not enough from ProductStats, return empty (the section hides itself)
    const watches = filtered.map(s => {
      const w = s.watch
      let images: string[] = []
      try {
        const parsed = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
        if (Array.isArray(parsed)) {
          images = parsed.filter((img: string) => typeof img === 'string' && !img.startsWith('data:image/'))
        }
      } catch { images = [] }

      let boosters: string[] = []
      try {
        boosters = typeof w.boosters === 'string' ? JSON.parse(w.boosters) : (w.boosters || [])
      } catch { boosters = [] }

      const highestBid = w.bids?.[0]?.amount || null
      const productId = w.articleNumber ? w.articleNumber.toString() : w.id

      return {
        id: w.id,
        title: w.title || '',
        brand: w.brand || '',
        model: w.model || '',
        price: highestBid || w.price,
        buyNowPrice: w.buyNowPrice,
        images,
        createdAt: w.createdAt.toISOString(),
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        condition: w.condition || '',
        boosters,
        articleNumber: w.articleNumber,
        paymentProtectionEnabled: w.paymentProtectionEnabled || false,
        href: `/products/${productId}`,
        sellerId: w.seller?.id,
        favoriteCount: s.favoriteCount,
        viewCount: s.viewCount,
      }
    })

    return NextResponse.json(
      { watches },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    )
  } catch (error) {
    console.error('Error fetching popular articles:', error)
    return NextResponse.json({ watches: [] }, { status: 500 })
  }
}
