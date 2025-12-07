import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// FAST API: Optimierte Route für schnelles Laden von Artikeln
// Verwendet Raw SQL für maximale Performance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const now = new Date()

    // OPTIMIERT: Verwende Prisma Query direkt (zuverlässiger als Raw SQL)
    // Raw SQL kann in verschiedenen Umgebungen unterschiedlich funktionieren
    const nowDate = new Date()

    const watches = await prisma.watch.findMany({
      where: {
        AND: [
          {
            // WICHTIG: Zeige ALLE Artikel außer explizit 'rejected'
            // Neue Artikel ohne moderationStatus (null) werden angezeigt
            OR: [
              { moderationStatus: null },
              { moderationStatus: { not: 'rejected' } },
            ],
          },
          {
            // WICHTIG: Zeige Artikel die NICHT verkauft sind
            // Neue Artikel ohne Purchase werden angezeigt
            OR: [
              { purchases: { none: {} } },
              { purchases: { every: { status: 'cancelled' } } },
            ],
          },
          {
            // WICHTIG: Zeige aktive Auktionen oder verkaufte Auktionen
            // Neue Artikel ohne auctionEnd werden angezeigt
            OR: [
              { auctionEnd: null },
              { auctionEnd: { gt: nowDate } },
              {
                AND: [
                  { auctionEnd: { lte: nowDate } },
                  { purchases: { some: { status: { not: 'cancelled' } } } },
                ],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        buyNowPrice: true,
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        articleNumber: true,
        boosters: true,
        condition: true,
        seller: {
          select: {
            city: true,
            postalCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    })

    // Transformiere Prisma-Format zu erwartetem Format
    const watchesFormatted = watches.map(w => ({
      id: w.id,
      title: w.title,
      brand: w.brand,
      model: w.model,
      price: w.price,
      buyNowPrice: w.buyNowPrice,
      images: w.images,
      createdAt: w.createdAt,
      isAuction: w.isAuction,
      auctionEnd: w.auctionEnd,
      articleNumber: w.articleNumber,
      boosters: w.boosters,
      condition: w.condition,
      city: w.seller?.city || null,
      postalCode: w.seller?.postalCode || null,
    }))

    // OPTIMIERT: Minimale Verarbeitung
    const watchesWithImages = watchesFormatted.map(w => {
      let firstImage = ''
      if (w.images) {
        try {
          const parsed = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
          firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
        } catch {
          firstImage = ''
        }
      }

      let boosters: string[] = []
      if (w.boosters) {
        try {
          boosters = typeof w.boosters === 'string' ? JSON.parse(w.boosters) : w.boosters
        } catch {
          boosters = []
        }
      }

      return {
        id: w.id,
        title: w.title || '',
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        buyNowPrice: w.buyNowPrice,
        images: firstImage ? [firstImage] : [],
        createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : new Date(w.createdAt).toISOString(),
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? (w.auctionEnd instanceof Date ? w.auctionEnd.toISOString() : new Date(w.auctionEnd).toISOString()) : null,
        articleNumber: w.articleNumber,
        boosters,
        city: w.city,
        postalCode: w.postalCode,
        condition: w.condition || '',
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
    console.error('Error fetching articles:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}

