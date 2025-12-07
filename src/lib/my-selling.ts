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

    // ABSOLUT MINIMALE Query: Nur die wichtigsten Felder (wie mine-instant)
    // KEINE bids oder purchases - das würde N+1 Problem verursachen und langsam sein
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
    },
    orderBy: { createdAt: 'desc' },
    // OPTIMIERT: Nutze Index watches_sellerId_createdAt_idx
  })

  // ULTRA-MINIMALE Verarbeitung für maximale Geschwindigkeit
  const result: MySellingItem[] = []

  for (const w of watches) {
    // OPTIMIERT: Nur erstes Bild parsen wenn wirklich vorhanden
    let images: string[] = []
    if (w.images && typeof w.images === 'string') {
      try {
        const parsed = JSON.parse(w.images)
        images = Array.isArray(parsed) && parsed.length > 0 ? [parsed[0]] : []
      } catch {
        images = []
      }
    }

    // OPTIMIERT: Minimale Date-Konvertierung
    const createdAt = w.createdAt instanceof Date
      ? w.createdAt.toISOString()
      : new Date(w.createdAt).toISOString()

    const auctionEnd = w.auctionEnd
      ? (w.auctionEnd instanceof Date ? w.auctionEnd.toISOString() : new Date(w.auctionEnd).toISOString())
      : null

    // Vereinfachte isActive Berechnung (ohne Purchase-Check für Geschwindigkeit)
    const isAuctionActive = !!w.isAuction || !!w.auctionEnd
    let isActive = true // Default: aktiv
    if (isAuctionActive && auctionEnd) {
      const auctionEndDate = new Date(auctionEnd)
      if (auctionEndDate <= now) {
        isActive = false
      }
    }

    result.push({
      id: w.id,
      articleNumber: w.articleNumber,
      title: w.title || '',
      brand: w.brand || '',
      model: w.model || '',
      price: w.price,
      images,
      createdAt,
      isSold: false, // Vereinfacht: wird client-side aktualisiert wenn nötig
      isAuction: isAuctionActive,
      auctionEnd,
      highestBid: null, // Wird client-side nachgeladen wenn nötig
      bidCount: 0, // Wird client-side nachgeladen wenn nötig
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

