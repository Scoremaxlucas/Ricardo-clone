import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ULTRA-SCHNELLE API: Lädt nur Basis-Daten ohne Relations
// Purchases und Bids werden später nachgeladen wenn nötig
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // OPTIMIERT: Laden der wichtigsten Felder plus Purchases für korrekten Status
    const watches = await prisma.watch.findMany({
      where: { sellerId: session.user.id },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        articleNumber: true,
        // WICHTIG: Purchases für korrekten isSold-Status
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Verarbeitung mit korrektem isSold und isActive Status
    const now = Date.now()
    const watchesWithImages = watches.map(w => {
      // Parse images
      let images: string[] = []
      if (w.images && typeof w.images === 'string') {
        try {
          images = JSON.parse(w.images)
        } catch {
          images = []
        }
      }

      // KORREKT: isSold basierend auf nicht-stornierten Purchases
      const activePurchases = w.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0

      // isActive Berechnung:
      // 1. Wenn verkauft → nicht aktiv
      // 2. Wenn Auktion abgelaufen → nicht aktiv
      // 3. Sonst → aktiv
      const auctionEndTime = w.auctionEnd ? w.auctionEnd.getTime() : null
      const isAuctionExpired = auctionEndTime && auctionEndTime <= now
      const isActive = !isSold && !isAuctionExpired

      return {
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title,
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        images,
        createdAt: w.createdAt.toISOString(),
        isSold,
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        highestBid: null,
        bidCount: 0,
        finalPrice: w.price,
        isActive,
      }
    })

    return NextResponse.json(
      { watches: watchesWithImages },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}
