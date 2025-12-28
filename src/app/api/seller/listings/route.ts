import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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
  purchaseId: string | null // For sold items - links to sale details
}

export interface ListingCounts {
  active: number
  drafts: number
  ended: number
  sold: number
}

/**
 * GET /api/seller/listings
 * Returns seller's listings with status filter and counts
 * Query params:
 *   - status: 'active' | 'ended' | 'sold' | 'all' (default: 'active')
 *   - search: string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'active'
    const search = searchParams.get('search') || ''
    const now = new Date()

    // Base where clause for all queries
    const baseWhere: any = {
      sellerId: session.user.id,
      OR: [{ moderationStatus: null }, { moderationStatus: { not: 'rejected' } }],
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

    // Fetch all listings for this user to calculate counts
    const allListings = await prisma.watch.findMany({
      where: baseWhere,
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
          select: { id: true, status: true },
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
      where: { userId: session.user.id },
    })

    // Calculate status for each listing
    const listingsWithStatus = allListings.map(listing => {
      const activePurchases = listing.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
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

      // Get purchaseId for sold items (first active purchase)
      const purchaseId = isSold ? activePurchases[0]?.id || null : null

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
      }
    })

    // Calculate counts
    const counts: ListingCounts = {
      active: listingsWithStatus.filter(l => l.status === 'active').length,
      drafts: draftsCount,
      ended: listingsWithStatus.filter(l => l.status === 'ended').length,
      sold: listingsWithStatus.filter(l => l.status === 'sold').length,
    }

    // Filter by status
    let filteredListings = listingsWithStatus
    if (statusFilter !== 'all') {
      if (statusFilter === 'archive') {
        // Archive = ended (not sold)
        filteredListings = listingsWithStatus.filter(l => l.status === 'ended')
      } else {
        filteredListings = listingsWithStatus.filter(l => l.status === statusFilter)
      }
    }

    return NextResponse.json({
      listings: filteredListings,
      counts,
    })
  } catch (error: any) {
    console.error('[seller/listings] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
