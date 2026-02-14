import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/articles/ending-soon
 * Returns auctions ending within the next 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 30)

    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const watches = await prisma.watch.findMany({
      where: {
        AND: [
          { isAuction: true },
          { auctionEnd: { gt: now, lte: in24h } },
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
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        articleNumber: true,
        condition: true,
        paymentProtectionEnabled: true,
        boosters: true,
        seller: { select: { id: true } },
        bids: {
          select: { amount: true },
          orderBy: { amount: 'desc' },
          take: 1,
        },
        _count: { select: { bids: true } },
      },
      orderBy: { auctionEnd: 'asc' }, // Soonest ending first
      take: limit,
    })

    const result = watches.map(w => {
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
        isAuction: true,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        condition: w.condition || '',
        boosters,
        articleNumber: w.articleNumber,
        paymentProtectionEnabled: w.paymentProtectionEnabled || false,
        href: `/products/${productId}`,
        sellerId: w.seller?.id,
        bidCount: w._count.bids,
      }
    })

    return NextResponse.json(
      { watches: result },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('Error fetching ending-soon auctions:', error)
    return NextResponse.json({ watches: [] }, { status: 500 })
  }
}
