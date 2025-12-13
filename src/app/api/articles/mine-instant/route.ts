import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// INSTANT API: Absolute minimale Query für sofortiges Laden
// Lädt nur ID, Titel, Preis und erstes Bild
export async function GET(request: NextRequest) {
  try {
    // OPTIMIERT: Session-Check parallel mit Query-Vorbereitung
    const sessionPromise = getServerSession(authOptions)

    // OPTIMIERT: Verwende userId aus Query-Parameter wenn verfügbar (noch schneller)
    const userId = request.nextUrl.searchParams.get('userId')

    let finalUserId: string | null = null

    if (userId) {
      // Wenn userId als Parameter übergeben wurde, verwende direkt (noch schneller)
      finalUserId = userId
    } else {
      // Sonst warte auf Session
      const session = await sessionPromise
      finalUserId = session?.user?.id || null
    }

    if (!finalUserId) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // ABSOLUT MINIMALE Query: Nur die wichtigsten Felder
    // OPTIMIERT: Verwende Index direkt (sellerId, createdAt DESC)
    const watches = await prisma.watch.findMany({
      where: { sellerId: finalUserId },
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
      // OPTIMIERT: Nutze Index watches_sellerId_createdAt_idx
    })

    // ULTRA-MINIMALE Verarbeitung für maximale Geschwindigkeit
    // OPTIMIERT: Verwende for-Schleife statt map für bessere Performance
    const watchesWithImages = []
    const now = Date.now() // Einmal berechnen statt in jeder Iteration

    for (const w of watches) {
      // OPTIMIERT: Nur erstes Bild parsen wenn wirklich vorhanden
      let firstImage = ''
      if (w.images && typeof w.images === 'string') {
        try {
          const parsed = JSON.parse(w.images)
          firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
        } catch {
          // Ignore parse errors
        }
      }

      // OPTIMIERT: Minimale Date-Konvertierung
      const createdAt = w.createdAt instanceof Date
        ? w.createdAt.toISOString()
        : new Date(w.createdAt).toISOString()

      const auctionEnd = w.auctionEnd
        ? (w.auctionEnd instanceof Date ? w.auctionEnd.toISOString() : new Date(w.auctionEnd).toISOString())
        : null

      watchesWithImages.push({
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title || '',
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        images: firstImage ? [firstImage] : [],
        createdAt,
        isSold: false,
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd,
        highestBid: null,
        bidCount: 0,
        finalPrice: w.price,
        isActive: true, // Vereinfacht: immer true für instant loading
      })
    }

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

