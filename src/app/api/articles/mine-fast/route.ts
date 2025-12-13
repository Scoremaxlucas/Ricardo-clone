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

    // ULTRA-MINIMALE Query: Nur die absolut notwendigsten Felder
    // OPTIMIERT: Verwende Index für maximale Geschwindigkeit
    // OPTIMIERT: Reduziere auf absolute Minimum-Felder
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
      // OPTIMIERT: Keine weiteren Filter oder Joins
    })

    // ULTRA-OPTIMIERT: Minimale Verarbeitung für maximale Geschwindigkeit
    const now = Date.now()
    const watchesWithImages = watches.map(w => {
      // OPTIMIERT: Nur parse images wenn wirklich vorhanden
      let images: string[] = []
      if (w.images && typeof w.images === 'string') {
        try {
          images = JSON.parse(w.images)
        } catch {
          // Fallback: versuche als Array zu behandeln
          images = []
        }
      }

      // OPTIMIERT: Schnelle Berechnung ohne zusätzliche Date-Objekte
      const auctionEndTime = w.auctionEnd ? w.auctionEnd.getTime() : null
      const isActive = !auctionEndTime || auctionEndTime > now

      return {
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title,
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        images,
        createdAt: w.createdAt.toISOString(),
        isSold: false,
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
