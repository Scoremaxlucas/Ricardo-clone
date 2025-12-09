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
  href?: string // WICHTIG: Expliziter href für Produktlinks
}

/**
 * Fetch featured products server-side for homepage
 * Optimized for fast initial page load
 */
export async function getFeaturedProducts(limit: number = 6): Promise<ProductItem[]> {
  try {
    const now = new Date()

    // WICHTIG: Zeige nur existierende Artikel (gelöschte werden automatisch nicht angezeigt)
    // Filter für moderationStatus und Purchase-Status
    const watches = await prisma.watch.findMany({
    where: {
      AND: [
        {
          // WICHTIG: Zeige ALLE Artikel außer explizit 'rejected'
          // Neue Artikel ohne moderationStatus (null) werden angezeigt
          // Auch Artikel mit moderationStatus: 'approved' oder 'pending' werden angezeigt
          OR: [
            { moderationStatus: null },
            { moderationStatus: { not: 'rejected' } },
          ],
        },
        {
          // WICHTIG: Zeige Artikel die NICHT verkauft sind
          // Neue Artikel ohne Purchase werden angezeigt
          // Artikel mit nur cancelled purchases werden angezeigt
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
        const parsedImages = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
        // OPTIMIERT: Mit VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR können wir Base64-Bilder wieder senden
        // Aber filtern wir trotzdem sehr große Bilder (>500KB Base64) um Performance zu optimieren
        images = Array.isArray(parsedImages)
          ? parsedImages.filter((img: string) => {
              // Erlaube Base64-Bilder, aber filtere sehr große (>500KB)
              if (img.startsWith('data:image/')) {
                // Base64 ist ~33% größer als Original, also ~375KB Original = ~500KB Base64
                return img.length < 500000 // ~500KB Base64
              }
              // Erlaube URLs
              return img.length < 1000
            })
          : []
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

    // WICHTIG: Verwende articleNumber für Link, falls vorhanden, sonst CUID
    // Dies stellt sicher, dass Produkte korrekt verlinkt sind
    const productId = w.articleNumber ? w.articleNumber.toString() : w.id

    return {
      id: w.id, // Behalte CUID für interne Verwendung
      title: w.title || '',
      brand: w.brand || '',
      model: w.model || '',
      price: highestBid || w.price,
      buyNowPrice: w.buyNowPrice,
      images: images, // Base64-Bilder <500KB sind jetzt erlaubt (mit VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR)
      createdAt: w.createdAt.toISOString(),
      isAuction: !!w.isAuction || !!w.auctionEnd,
      auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
      condition: w.condition || '',
      boosters,
      city: w.seller?.city || null,
      postalCode: w.seller?.postalCode || null,
      articleNumber: w.articleNumber,
      // WICHTIG: Setze href explizit, damit der richtige Link verwendet wird
      href: `/products/${productId}`,
    }
  })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    // Return empty array on error to prevent Server Component crash
    return []
  }
}

