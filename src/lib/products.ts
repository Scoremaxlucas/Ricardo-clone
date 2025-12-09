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
        
        if (!Array.isArray(parsedImages)) {
          console.warn(`[getFeaturedProducts] Watch ${w.id} images is not an array:`, typeof parsedImages, parsedImages)
          images = []
        } else if (parsedImages.length === 0) {
          console.warn(`[getFeaturedProducts] Watch ${w.id} has empty images array`)
          images = []
        } else {
          const titleImage = parsedImages[0] // Titelbild
          
          if (!titleImage || typeof titleImage !== 'string') {
            console.warn(`[getFeaturedProducts] Watch ${w.id} titleImage is invalid:`, typeof titleImage, titleImage)
            images = []
          } else {
            // KRITISCH: WIE RICARDO - IMMER Titelbild behalten!
            // Für sehr große Base64-Bilder (>3MB) trotzdem filtern um Deployment zu ermöglichen
            // Aber sehr hohes Limit für sofortige Anzeige
            if (titleImage.startsWith('data:image/')) {
              // Sehr hohes Limit für Titelbild: 3MB Base64 (~2.25MB Original)
              // Dies ermöglicht praktisch alle Bilder sofort, während extrem große über API geladen werden
              if (titleImage.length < 3000000) {
                images = [titleImage]
                console.log(`[getFeaturedProducts] Watch ${w.id} titleImage included (${Math.round(titleImage.length / 1024)}KB Base64)`)
              } else {
                // Extrem große Titelbilder (>3MB) werden über Batch-API nachgeladen (extrem selten)
                console.warn(`[getFeaturedProducts] Watch ${w.id} titleImage too large (${Math.round(titleImage.length / 1024)}KB), will load via Batch API`)
                images = []
              }
            } else {
              // URLs sind immer klein, behalten
              images = [titleImage]
              console.log(`[getFeaturedProducts] Watch ${w.id} titleImage is URL:`, titleImage.substring(0, 50))
            }

            // OPTIMIERT: Behalte zusätzliche Bilder wenn sie klein genug sind
            // Erlaube bis zu 800KB Base64 für zusätzliche Bilder
            const smallAdditionalImages = parsedImages.slice(1).filter((img: string) => {
              if (typeof img !== 'string') return false
              if (img.startsWith('data:image/')) {
                return img.length < 800000 // <800KB Base64 für zusätzliche Bilder
              }
              // URLs sind immer klein
              return img.length < 1000
            })

            images = [...images, ...smallAdditionalImages]
            console.log(`[getFeaturedProducts] Watch ${w.id} total images: ${images.length} (${parsedImages.length} original)`)
          }
        }
      } catch (error) {
        console.error(`[getFeaturedProducts] Error parsing images for watch ${w.id}:`, error)
        images = []
      }
    } else {
      console.warn(`[getFeaturedProducts] Watch ${w.id} has no images field`)
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

