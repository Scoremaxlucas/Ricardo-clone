import { prisma } from '@/lib/prisma'

export interface MySellingItem {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
  isActive: boolean
}

/**
 * Fetch user's selling articles server-side for instant rendering
 * ULTRA-OPTIMIZED: Minimal query like mine-instant API for maximum speed
 * Details (bids, purchases) can be loaded client-side if needed
 */
export async function getMySellingArticles(userId: string): Promise<MySellingItem[]> {
  try {
    const now = new Date()

    // Query mit Purchases für korrekten isSold Status
    // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
    const watches = await prisma.watch.findMany({
      where: {
        sellerId: userId,
        AND: [
          {
            OR: [
              { moderationStatus: null },
              { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
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
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        articleNumber: true,
        moderationStatus: true,
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
    const result: MySellingItem[] = []

    for (const w of watches) {
      // Parse images
      let images: string[] = []
      if (w.images && typeof w.images === 'string') {
        try {
          const parsed = JSON.parse(w.images)
          images = Array.isArray(parsed) && parsed.length > 0 ? [parsed[0]] : []
        } catch {
          images = []
        }
      }

      // Date-Konvertierung
      const createdAt =
        w.createdAt instanceof Date
          ? w.createdAt.toISOString()
          : new Date(w.createdAt).toISOString()

      const auctionEnd = w.auctionEnd
        ? w.auctionEnd instanceof Date
          ? w.auctionEnd.toISOString()
          : new Date(w.auctionEnd).toISOString()
        : null

      // KORREKT: isSold basierend auf nicht-stornierten Purchases
      const activePurchases = w.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0

      // isActive Berechnung:
      // 1. Wenn verkauft → nicht aktiv
      // 2. Wenn Auktion abgelaufen → nicht aktiv
      // 3. Sonst → aktiv
      const isAuctionActive = !!w.isAuction || !!w.auctionEnd
      const auctionEndDate = auctionEnd ? new Date(auctionEnd) : null
      const isAuctionExpired = auctionEndDate && auctionEndDate <= now
      const isActive = !isSold && !isAuctionExpired

      result.push({
        id: w.id,
        articleNumber: w.articleNumber,
        title: w.title || '',
        brand: w.brand || '',
        model: w.model || '',
        price: w.price,
        images,
        createdAt,
        isSold,
        isAuction: isAuctionActive,
        auctionEnd,
        highestBid: null,
        bidCount: 0,
        finalPrice: w.price,
        isActive,
      })
    }

    return result
  } catch (error) {
    console.error('Error fetching my selling articles:', error)
    // Return empty array on error to prevent Server Component crash
    return []
  }
}
