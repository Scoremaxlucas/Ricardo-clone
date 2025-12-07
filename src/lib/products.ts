import { prisma } from '@/lib/prisma'

export interface ProductItem {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice?: number | null
  isAuction: boolean
  auctionEnd?: string | null
  images: string[]
  condition: string
  createdAt: string
  boosters?: string[]
  city?: string | null
  postalCode?: string | null
  articleNumber?: number | null
}

/**
 * Fetch featured products server-side for homepage
 * Optimized for fast initial page load
 */
export async function getFeaturedProducts(limit: number = 6): Promise<ProductItem[]> {
  try {
    const now = new Date()

    const watches = await prisma.watch.findMany({
    where: {
      AND: [
        {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { not: 'rejected' } },
          ],
        },
        {
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } },
          ],
        },
        {
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
            {
              AND: [
                { auctionEnd: { lte: now } },
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
      bids: {
        select: {
          amount: true,
        },
        orderBy: { amount: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return watches.map(w => {
    let images: string[] = []
    if (w.images) {
      try {
        images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
      } catch {
        images = []
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

    const highestBid = w.bids?.[0]?.amount || null

    return {
      id: w.id,
      title: w.title || '',
      brand: w.brand || '',
      model: w.model || '',
      price: highestBid || w.price,
      buyNowPrice: w.buyNowPrice,
      images: Array.isArray(images) ? images : [],
      createdAt: w.createdAt.toISOString(),
      isAuction: !!w.isAuction || !!w.auctionEnd,
      auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
      condition: w.condition || '',
      boosters,
      city: w.seller?.city || null,
      postalCode: w.seller?.postalCode || null,
      articleNumber: w.articleNumber,
    }
  })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    // Return empty array on error to prevent Server Component crash
    return []
  }
}

