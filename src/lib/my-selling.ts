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
 * Optimized for fast initial page load
 */
export async function getMySellingArticles(userId: string): Promise<MySellingItem[]> {
  const now = new Date()

  const watches = await prisma.watch.findMany({
    where: { sellerId: userId },
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
      purchases: {
        where: {
          status: { not: 'cancelled' },
        },
        select: {
          id: true,
          status: true,
        },
        take: 1,
      },
      bids: {
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { amount: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return watches.map(w => {
    // Parse images
    let images: string[] = []
    if (w.images) {
      try {
        images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
      } catch {
        images = []
      }
    }

    const highestBid = w.bids?.[0] || null
    const hasPurchase = w.purchases.length > 0
    const isSold = hasPurchase

    // Determine if auction is active
    let isActive = !isSold
    if (w.isAuction && w.auctionEnd) {
      const auctionEndDate = new Date(w.auctionEnd)
      if (auctionEndDate <= now) {
        isActive = false
      }
    }

    const finalPrice = highestBid?.amount || w.price

    return {
      id: w.id,
      articleNumber: w.articleNumber,
      title: w.title || '',
      brand: w.brand || '',
      model: w.model || '',
      price: w.price,
      images: Array.isArray(images) ? images : [],
      createdAt: w.createdAt.toISOString(),
      isSold,
      isAuction: !!w.isAuction || !!w.auctionEnd,
      auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
      highestBid: highestBid
        ? {
            amount: highestBid.amount,
            createdAt: highestBid.createdAt.toISOString(),
          }
        : null,
      bidCount: w.bids?.length || 0,
      finalPrice,
      isActive,
    }
  })
}

