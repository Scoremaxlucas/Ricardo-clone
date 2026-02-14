import { getMainAddress } from '@/lib/address'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
    // WICHTIG: Lockere Filter um ALLE vorherigen Artikel wiederherzustellen
    const nowDate = new Date()

    const watches = await prisma.watch.findMany({
      where: {
        AND: [
          {
            // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
            OR: [
              { moderationStatus: null },
              { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
            ],
          },
          {
            // WICHTIG: Zeige Artikel die NICHT verkauft sind
            // Neue Artikel ohne Purchase werden angezeigt
            // Artikel mit nur cancelled purchases werden angezeigt
            OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
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
        paymentProtectionEnabled: true,
        shippingMethod: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    })

    // Fetch seller addresses from UserAddress table
    const sellerIds = Array.from(new Set(watches.map(w => w.seller?.id).filter(Boolean))) as string[]
    const sellerAddresses = await Promise.all(
      sellerIds.map(async id => ({
        id,
        address: await getMainAddress(id),
      }))
    )
    const addressMap = new Map(sellerAddresses.map(sa => [sa.id, sa.address]))

    // Transformiere Prisma-Format zu erwartetem Format
    const watchesFormatted = watches.map(w => {
      const sellerAddress = w.seller?.id ? addressMap.get(w.seller.id) : null

      // Parse shippingMethod JSON to array
      let shippingMethods: string[] = []
      try {
        if (w.shippingMethod) {
          const parsed = typeof w.shippingMethod === 'string' ? JSON.parse(w.shippingMethod) : w.shippingMethod
          shippingMethods = Array.isArray(parsed) ? parsed : []
        }
      } catch {
        shippingMethods = []
      }

      // Calculate minimum shipping cost
      const shippingOnlyMethods = shippingMethods.filter(m => m !== 'pickup')
      let shippingMinCost: number | null = null
      if (shippingOnlyMethods.length > 0) {
        const rateMap: Record<string, number> = { 'b-post': 8.5, 'a-post': 12.5 }
        const costs = shippingOnlyMethods.map(m => rateMap[m] || 8.5)
        shippingMinCost = Math.min(...costs)
      }

      return {
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
        paymentProtectionEnabled: w.paymentProtectionEnabled,
        shippingMethods,
        shippingMinCost,
        sellerId: w.sellerId,
        sellerVerified: w.seller?.verified || false,
        city: sellerAddress?.city || null,
        postalCode: sellerAddress?.postalCode || null,
      }
    })

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
        createdAt:
          w.createdAt instanceof Date
            ? w.createdAt.toISOString()
            : new Date(w.createdAt).toISOString(),
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd
          ? w.auctionEnd instanceof Date
            ? w.auctionEnd.toISOString()
            : new Date(w.auctionEnd).toISOString()
          : null,
        articleNumber: w.articleNumber,
        boosters,
        city: w.city,
        postalCode: w.postalCode,
        condition: w.condition || '',
        paymentProtectionEnabled: w.paymentProtectionEnabled || false,
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
