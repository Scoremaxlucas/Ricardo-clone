import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // ABSOLUT MINIMALE Query: Nur Basis-Daten, KEINE Relations
    // OPTIMIERT: Verwende Index für maximale Geschwindigkeit
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
      },
      orderBy: { createdAt: 'desc' },
      // OPTIMIERT: Verwende den Index watches_sellerId_createdAt_idx
    })

    // OPTIMIERT: Ultra-schnelle Verarbeitung OHNE zusätzliche Queries
    const now = Date.now()
    const watchesWithImages = watches.map(w => {
      let images: string[] = []
      if (w.images) {
        try {
          images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
        } catch {
          images = []
        }
      }

      const auctionEndDate = w.auctionEnd ? w.auctionEnd.getTime() : null
      const isExpired = auctionEndDate ? auctionEndDate <= now : false
      const isActive = !auctionEndDate || !isExpired

      return {
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title,
        brand: w.brand,
        model: w.model,
        price: w.price,
        images,
        createdAt: w.createdAt.toISOString(),
        isSold: false, // Wird später nachgeladen wenn nötig
        isAuction: w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        highestBid: null, // Wird später nachgeladen wenn nötig
        bidCount: 0, // Wird später nachgeladen wenn nötig
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
