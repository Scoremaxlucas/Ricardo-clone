import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Seller Listings API - "Mein Verkaufen" Dashboard
 *
 * ============================================================================
 * VISIBILITY COMPARISON WITH PUBLIC SEARCH
 * ============================================================================
 *
 * This endpoint shows ALL listings for the authenticated seller, including:
 * - Active listings (visible in public search)
 * - Sold items (hidden from public search)
 * - Expired auctions (hidden from public search)
 *
 * The ONLY filter applied here is:
 * - moderationStatus != 'rejected' (rejected listings are hidden everywhere)
 *
 * Compare with Public Search (/api/watches/search):
 * - Additional filters: notSold, auctionNotExpired
 * - A listing appearing here but NOT in search could be:
 *   1. Sold (has active purchase)
 *   2. Expired auction without purchase
 *   3. Very new and browser/API cache issue (rare)
 *
 * For debugging, use: GET /api/watches/{id}/visibility-check
 * ============================================================================
 */

export type ListingStatus = 'active' | 'ended' | 'sold'

export interface SellerListing {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  auctionEnd: string | null
  isAuction: boolean
  status: ListingStatus
  bidCount: number
  highestBid: number | null
  purchaseId: string | null
  orderId: string | null // NEW: Support for Order system
  // Dispute fields für Verkäufer-Übersicht
  disputeOpenedAt: string | null
  disputeStatus: string | null
}

export interface ListingCounts {
  active: number
  drafts: number
  ended: number
  sold: number
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'active'
    const search = searchParams.get('search') || ''
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10)
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 200)
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)
    const now = new Date()

    // Base where clause for all queries
    // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
    const baseWhere: Record<string, unknown> = {
      sellerId: userId,
      OR: [
        { moderationStatus: null },
        { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
      ],
    }

    // Add search filter if provided
    if (search.trim()) {
      const searchTerm = search.trim()
      const isNumeric = /^\d{6,10}$/.test(searchTerm)

      if (isNumeric) {
        baseWhere.articleNumber = parseInt(searchTerm)
      } else {
        baseWhere.AND = [
          {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { brand: { contains: searchTerm, mode: 'insensitive' } },
              { model: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ]
      }
    }

    const notSoldBase = {
      purchases: { none: { status: { not: 'cancelled' } } },
      orders: { none: { orderStatus: { notIn: ['canceled', 'cancelled'] } } },
    }

    // Status filter for DB query (enables correct pagination)
    let statusWhere: Record<string, unknown> = {}
    if (statusFilter === 'sold') {
      statusWhere = {
        OR: [
          { purchases: { some: { status: { not: 'cancelled' } } } },
          { orders: { some: { orderStatus: { notIn: ['canceled', 'cancelled'] } } } },
        ],
      }
    } else if (statusFilter === 'ended') {
      statusWhere = {
        ...notSoldBase,
        isAuction: true,
        auctionEnd: { lte: now },
      }
    } else if (statusFilter === 'active') {
      statusWhere = {
        ...notSoldBase,
        OR: [{ isAuction: false }, { auctionEnd: { gt: now } }],
      }
    } else if (statusFilter === 'archive') {
      statusWhere = {
        ...notSoldBase,
        isAuction: true,
        auctionEnd: { lte: now },
      }
    }

    const fetchWhere = { ...baseWhere, ...statusWhere }

    // Fetch total count for pagination (for current status filter)
    const totalCount = await prisma.watch.count({
      where: fetchWhere,
    })

    // Fetch listings with pagination
    const allListings = await prisma.watch.findMany({
      where: fetchWhere,
      skip: offset,
      take: limit,
      select: {
        id: true,
        articleNumber: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        purchases: {
          select: {
            id: true,
            status: true,
            disputeOpenedAt: true,
            disputeStatus: true,
          },
        },
        // NEW: Also fetch orders to properly detect sold items
        orders: {
          select: {
            id: true,
            orderStatus: true,
            disputeOpenedAt: true,
            disputeStatus: true,
          },
        },
        bids: {
          select: { amount: true },
          orderBy: { amount: 'desc' },
          take: 1,
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch drafts count separately
    const draftsCount = await prisma.draft.count({
      where: { userId },
    })

    // Calculate status for each listing
    // IMPORTANT: Check BOTH purchases AND orders to determine sold status
    const listingsWithStatus = allListings.map(listing => {
      // Check purchases (old system)
      const activePurchases = listing.purchases.filter(p => p.status !== 'cancelled')
      const hasPurchase = activePurchases.length > 0

      // Check orders (new system) - canceled orders don't count as sold
      const activeOrders = listing.orders.filter(o =>
        o.orderStatus !== 'canceled' && o.orderStatus !== 'cancelled'
      )
      const hasOrder = activeOrders.length > 0

      // Item is sold if it has EITHER an active purchase OR an active order
      const isSold = hasPurchase || hasOrder

      const auctionEndDate = listing.auctionEnd ? new Date(listing.auctionEnd) : null
      const isAuctionExpired = auctionEndDate && auctionEndDate <= now

      let status: ListingStatus
      if (isSold) {
        status = 'sold'
      } else if (isAuctionExpired) {
        status = 'ended'
      } else {
        status = 'active'
      }

      // Parse images
      let images: string[] = []
      if (listing.images && typeof listing.images === 'string') {
        try {
          images = JSON.parse(listing.images)
        } catch {
          images = []
        }
      }

      // Get IDs for sold items (prefer purchase, fallback to order)
      const activePurchase = hasPurchase ? activePurchases[0] : null
      const activeOrder = hasOrder ? activeOrders[0] : null
      const purchaseId = activePurchase?.id || null
      const orderId = activeOrder?.id || null

      // Debug logging for sold items
      if (isSold) {
        console.log(
          `[seller/listings] Sold item: ${listing.title}, purchaseId: ${purchaseId}, orderId: ${orderId}, ` +
          `purchases: ${listing.purchases.length}, orders: ${listing.orders.length}`
        )
      }

      // Get dispute data from either purchase or order
      const disputeSource = activePurchase || activeOrder

      return {
        id: listing.id,
        articleNumber: listing.articleNumber,
        title: listing.title,
        brand: listing.brand || '',
        model: listing.model || '',
        price: listing.price,
        images,
        createdAt: listing.createdAt.toISOString(),
        auctionEnd: listing.auctionEnd?.toISOString() || null,
        isAuction: listing.isAuction || !!listing.auctionEnd,
        status,
        bidCount: listing._count.bids,
        highestBid: listing.bids[0]?.amount || null,
        purchaseId,
        orderId, // NEW: Include orderId for Order-based sales
        // Dispute-Daten für Verkäufer-Übersicht
        disputeOpenedAt: disputeSource?.disputeOpenedAt?.toISOString() || null,
        disputeStatus: disputeSource?.disputeStatus || null,
      }
    })

    // Status filter already applied at DB level
    const filteredListings = listingsWithStatus

    // Counts for tab badges - run in parallel for performance (reuse notSoldBase from above)
    const [soldCount, endedCount, activeCount] = await Promise.all([
      prisma.watch.count({
        where: {
          ...baseWhere,
          OR: [
            { purchases: { some: { status: { not: 'cancelled' } } } },
            { orders: { some: { orderStatus: { notIn: ['canceled', 'cancelled'] } } } },
          ],
        },
      }),
      prisma.watch.count({
        where: {
          ...baseWhere,
          ...notSoldBase,
          isAuction: true,
          auctionEnd: { lte: now },
        },
      }),
      prisma.watch.count({
        where: {
          ...baseWhere,
          ...notSoldBase,
          OR: [{ isAuction: false }, { auctionEnd: { gt: now } }],
        },
      }),
    ])

    const counts: ListingCounts = {
      active: activeCount,
      drafts: draftsCount,
      ended: endedCount,
      sold: soldCount,
    }

    return NextResponse.json({
      listings: filteredListings,
      counts,
      total: totalCount,
    })
  } catch (error: any) {
    console.error('[seller/listings] CRITICAL ERROR:', error.message)
    console.error('[seller/listings] Stack:', error.stack)
    console.error('[seller/listings] Code:', error.code)
    return NextResponse.json(
      {
        error: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
