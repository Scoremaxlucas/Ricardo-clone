import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Visibility Check Endpoint - Debug tool for diagnosing why a listing
 * might not be visible in public search.
 *
 * Returns detailed breakdown of all visibility conditions.
 *
 * Usage: GET /api/watches/{id}/visibility-check
 *
 * Enable with env: ENABLE_VISIBILITY_DEBUG=true (default: true in development)
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VisibilityResult {
  watchId: string
  isVisible: boolean
  reasons: string[]
  checks: {
    exists: boolean
    moderationStatus: string | null
    moderationPassed: boolean
    purchaseCount: number
    activePurchaseCount: number
    notSold: boolean
    isAuction: boolean
    auctionEnd: string | null
    auctionNotExpired: boolean
    createdAt: string
    ageSeconds: number
  }
  recommendation: string | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Check if debug is enabled
  const debugEnabled =
    process.env.ENABLE_VISIBILITY_DEBUG === 'true' || process.env.NODE_ENV === 'development'

  if (!debugEnabled) {
    return NextResponse.json(
      { error: 'Visibility debug is disabled. Set ENABLE_VISIBILITY_DEBUG=true to enable.' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const now = new Date()

    // Fetch the watch with all relevant data
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        moderationStatus: true,
        isAuction: true,
        auctionEnd: true,
        createdAt: true,
        sellerId: true,
        purchases: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({
        watchId: id,
        isVisible: false,
        reasons: ['Watch does not exist in database'],
        checks: {
          exists: false,
          moderationStatus: null,
          moderationPassed: false,
          purchaseCount: 0,
          activePurchaseCount: 0,
          notSold: false,
          isAuction: false,
          auctionEnd: null,
          auctionNotExpired: false,
          createdAt: '',
          ageSeconds: 0,
        },
        recommendation:
          'Check if the listing was created successfully. Verify the watch ID is correct.',
      } satisfies VisibilityResult)
    }

    const reasons: string[] = []

    // Check 1: Moderation status
    const moderationPassed =
      watch.moderationStatus === null || watch.moderationStatus !== 'rejected'

    if (!moderationPassed) {
      reasons.push(`Moderation status is 'rejected' - listing was rejected by admin`)
    }

    // Check 2: Not sold (no active purchases)
    const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
    const notSold = activePurchases.length === 0

    if (!notSold) {
      reasons.push(`Listing has ${activePurchases.length} active purchase(s) - item is sold`)
    }

    // Check 3: Auction not expired
    const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
    const auctionNotExpired =
      !auctionEndDate || // Not an auction
      auctionEndDate > now || // Auction still running
      activePurchases.length > 0 // Has a purchase (allowed for ended auctions)

    if (!auctionNotExpired) {
      reasons.push(
        `Auction ended at ${watch.auctionEnd} without a purchase - expired auctions are hidden`
      )
    }

    // Calculate overall visibility
    const isVisible = moderationPassed && notSold && auctionNotExpired

    // Generate recommendation if not visible
    let recommendation: string | null = null
    if (!isVisible) {
      if (!moderationPassed) {
        recommendation = 'Contact admin to review moderation decision or create a new listing.'
      } else if (!notSold) {
        recommendation =
          'Item is sold. Buyer can see purchase details. Listing correctly hidden from search.'
      } else if (!auctionNotExpired) {
        recommendation = 'Auction has ended. Consider relisting or extending the auction duration.'
      }
    }

    const ageSeconds = Math.floor((now.getTime() - watch.createdAt.getTime()) / 1000)

    const result: VisibilityResult = {
      watchId: id,
      isVisible,
      reasons: isVisible ? ['All visibility checks passed'] : reasons,
      checks: {
        exists: true,
        moderationStatus: watch.moderationStatus,
        moderationPassed,
        purchaseCount: watch.purchases.length,
        activePurchaseCount: activePurchases.length,
        notSold,
        isAuction: watch.isAuction,
        auctionEnd: watch.auctionEnd?.toISOString() || null,
        auctionNotExpired,
        createdAt: watch.createdAt.toISOString(),
        ageSeconds,
      },
      recommendation,
    }

    // Add cache headers to prevent any caching of this debug endpoint
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Visibility-Check': isVisible ? 'visible' : 'hidden',
      },
    })
  } catch (error: any) {
    console.error('[visibility-check] Error:', error)
    return NextResponse.json(
      { error: 'Internal error checking visibility', message: error.message },
      { status: 500 }
    )
  }
}
