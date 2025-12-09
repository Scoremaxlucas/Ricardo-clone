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
        // KRITISCH: Für Deployment-Größe müssen wir Base64-Bilder stark reduzieren
        // Nur sehr kleine Base64-Bilder (<100KB) im initialen Response senden
        // Größere Bilder werden über /api/watches/[id]/images nachgeladen
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          const titleImage = parsedImages[0] // Titelbild

          // OPTIMIERT: Für bessere Performance - immer Titelbild behalten wenn möglich
          // Aber für sehr große Base64-Bilder (>200KB) trotzdem filtern
          // Dies ermöglicht sofortige Anzeige kleiner Bilder, während große über Batch-API geladen werden
          if (titleImage.startsWith('data:image/')) {
            // Erhöhtes Limit für Titelbild: 200KB Base64 (~150KB Original)
            // Dies ermöglicht mehr Bilder im initialen Response ohne Page-Größe zu sprengen
            if (titleImage.length < 200000) {
              images = [titleImage]
            } else {
              // Sehr große Titelbilder werden über Batch-API nachgeladen
              images = []
            }
          } else {
            // URLs sind immer klein, behalten
            images = [titleImage]
          }

          // Zusätzliche Bilder: Filtere große Base64-Bilder (werden über Batch-API geladen)
          const smallAdditionalImages = parsedImages.slice(1).filter((img: string) => {
            if (img.startsWith('data:image/')) {
              return img.length < 150000 // <150KB Base64 für zusätzliche Bilder
            }
            // URLs sind immer klein
            return img.length < 1000
          })

          images = [...images, ...smallAdditionalImages]
        } else {
          images = []
        }
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
      images: images, // KRITISCH: Nur sehr kleine Base64-Bilder (<100KB) im initialen Response
      // Größere Bilder werden über /api/watches/[id]/images nachgeladen
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

