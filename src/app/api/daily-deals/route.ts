import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Daily Deals (Feature 9: Gamification)
 *
 * GET /api/daily-deals - Holt aktive Daily Deals
 */

export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    const deals = await prisma.dailyDeal.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Hole Watch-Daten separat für alle Deals
    const watchIds = deals.map(deal => deal.watchId)
    const watches = await prisma.watch.findMany({
      where: {
        id: { in: watchIds },
      },
      select: {
        id: true,
        title: true,
        brand: true,
        price: true,
        images: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const watchMap = new Map(watches.map(w => [w.id, w]))

    const dealsWithDiscountPrice = deals.map(deal => {
      const watch = watchMap.get(deal.watchId)
      if (!watch) {
        return null
      }
      
      const discountPrice = watch.price * (1 - deal.discountPercent / 100)

      return {
        id: deal.id,
        watchId: deal.watchId,
        discountPercent: deal.discountPercent,
        originalPrice: watch.price,
        discountPrice,
        startDate: deal.startDate,
        endDate: deal.endDate,
        maxQuantity: deal.maxQuantity,
        soldQuantity: deal.soldQuantity,
        remainingQuantity: deal.maxQuantity - deal.soldQuantity,
        watch,
      }
    }).filter((deal): deal is NonNullable<typeof deal> => deal !== null)

    return NextResponse.json({ deals: dealsWithDiscountPrice })
  } catch (error: any) {
    console.error('Error fetching daily deals:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Daily Deals' }, { status: 500 })
  }
}
