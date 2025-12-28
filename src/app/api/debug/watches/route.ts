import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all watches with their status
    const watches = await prisma.watch.findMany({
      select: {
        id: true,
        articleNumber: true,
        title: true,
        moderationStatus: true,
        sellerId: true,
        createdAt: true,
        auctionEnd: true,
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            bids: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by moderation status
    const byStatus = {
      pending: watches.filter(w => w.moderationStatus === 'pending' || !w.moderationStatus).length,
      approved: watches.filter(w => w.moderationStatus === 'approved').length,
      rejected: watches.filter(w => w.moderationStatus === 'rejected').length,
      reviewing: watches.filter(w => w.moderationStatus === 'reviewing').length,
    }

    // Get unique sellers
    const uniqueSellers = Array.from(new Set(watches.map(w => w.sellerId)))

    return NextResponse.json({
      totalWatches: watches.length,
      byStatus,
      uniqueSellerCount: uniqueSellers.length,
      watches: watches.map(w => ({
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title?.substring(0, 40),
        moderationStatus: w.moderationStatus,
        sellerEmail: w.seller?.email,
        purchaseCount: w._count.purchases,
        bidCount: w._count.bids,
        auctionEnd: w.auctionEnd,
      })),
    })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
