import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// INSTANT API: Absolute minimale Query für sofortiges Laden
// Lädt nur ID, Titel, Preis und erstes Bild
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // ABSOLUT MINIMALE Query: Nur die wichtigsten Felder
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
    })

    // MINIMALE Verarbeitung
    const watchesWithImages = watches.map(w => {
      // Nur erstes Bild parsen für maximale Geschwindigkeit
      let firstImage = ''
      if (w.images) {
        try {
          const parsed = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
          firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
        } catch {
          firstImage = ''
        }
      }

      return {
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title,
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        images: firstImage ? [firstImage] : [],
        createdAt: w.createdAt.toISOString(),
        isSold: false,
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
        highestBid: null,
        bidCount: 0,
        finalPrice: w.price,
        isActive: true, // Vereinfacht: immer true für instant loading
      }
    })

    return NextResponse.json(
      { watches: watchesWithImages },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}

