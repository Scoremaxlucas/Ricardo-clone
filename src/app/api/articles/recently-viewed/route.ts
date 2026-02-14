import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/articles/recently-viewed
 * Returns recently viewed articles for the current user (from PageView data)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Need either a session or a sessionId cookie
    const sessionId = request.cookies.get('analytics_session')?.value
    const userId = session?.user?.id

    if (!userId && !sessionId) {
      return NextResponse.json({ watches: [] })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 30)
    const now = new Date()

    // Find recent product page views for this user/session
    const recentViews = await prisma.pageView.findMany({
      where: {
        ...(userId ? { userId } : { sessionId: sessionId! }),
        path: { startsWith: '/products/' },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Get more to deduplicate
      select: {
        path: true,
        createdAt: true,
      },
    })

    if (recentViews.length === 0) {
      return NextResponse.json({ watches: [] })
    }

    // Extract unique product IDs from paths (e.g., /products/123 -> 123)
    const seen = new Set<string>()
    const productIds: string[] = []
    for (const view of recentViews) {
      const parts = view.path.split('/')
      const id = parts[parts.length - 1]
      if (id && !seen.has(id)) {
        seen.add(id)
        productIds.push(id)
        if (productIds.length >= limit) break
      }
    }

    if (productIds.length === 0) {
      return NextResponse.json({ watches: [] })
    }

    // Fetch the watches - try by articleNumber first, then by ID
    const watches = await prisma.watch.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: { in: productIds } },
              { articleNumber: { in: productIds.filter(id => !isNaN(Number(id))).map(Number) } },
            ],
          },
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
      },
    })

    // Sort by the order they were viewed (most recent first)
    const watchMap = new Map(watches.map(w => {
      const artNum = w.articleNumber?.toString()
      return [
        w.id,
        { watch: w, artNum },
      ]
    }))

    // Also map by articleNumber
    const artNumMap = new Map(watches.map(w => [w.articleNumber?.toString() || '', w]))

    const sortedWatches = productIds
      .map(id => watchMap.get(id)?.watch || artNumMap.get(id))
      .filter(Boolean)
      .map(w => {
        if (!w) return null
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
        }
      })
      .filter(Boolean)

    return NextResponse.json({ watches: sortedWatches })
  } catch (error) {
    console.error('Error fetching recently viewed articles:', error)
    return NextResponse.json({ watches: [] }, { status: 500 })
  }
}
