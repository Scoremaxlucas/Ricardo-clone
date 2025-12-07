import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// OPTIMIERT: Ultra-schnelle API für initiales Laden
// Lädt nur Basis-Daten ohne Purchases/Bids
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // ABSOLUT MINIMALE Query: Nur Basis-Daten
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
      take: 50, // Limit für maximale Geschwindigkeit
    })

    // Schnelle Verarbeitung
    const watchesWithImages = watches.map(w => {
      let images: string[] = []
      try {
        images = w.images ? JSON.parse(w.images) : []
      } catch {
        images = []
      }

      const now = new Date()
      const auctionEndDate = w.auctionEnd ? new Date(w.auctionEnd) : null
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
        isSold: false,
        isAuction: w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        highestBid: null,
        bidCount: 0,
        finalPrice: w.price,
        isActive,
      }
    })

    return NextResponse.json({ watches: watchesWithImages }, { status: 200 })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}

