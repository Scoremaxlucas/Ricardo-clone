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
            console.warn(
              `[getFeaturedProducts] Watch ${w.id} images is not an array:`,
              typeof parsedImages,
              parsedImages
            )
            images = []
          } else if (parsedImages.length === 0) {
            console.warn(`[getFeaturedProducts] Watch ${w.id} has empty images array`)
            images = []
          } else {
            const titleImage = parsedImages[0] // Titelbild

            if (!titleImage || typeof titleImage !== 'string') {
              console.warn(
                `[getFeaturedProducts] Watch ${w.id} titleImage is invalid:`,
                typeof titleImage,
                titleImage
              )
              images = []
            } else {
              // KRITISCH: FÜR DEPLOYMENT - KEINE Base64-Bilder mehr in Server-Response!
              // Base64-Bilder verursachen Page-Größen >20MB und Deployment-Fehler
              // Nur URLs (Blob Storage) werden behalten - Base64 wird über Batch-API nachgeladen
              // Dies ermöglicht erfolgreiche Deployments und Skalierung wie Ricardo

              if (titleImage.startsWith('data:image/')) {
                // KRITISCH: Base64-Bilder werden NICHT in Server-Response enthalten (Page-Größe!)
                // Sie werden über Batch-API nachgeladen UND automatisch zu Blob Storage migriert
                // Die Batch-API migriert Base64 zu Blob Storage beim ersten Aufruf
                images = []
              } else if (titleImage.startsWith('http://') || titleImage.startsWith('https://')) {
                // URLs (Blob Storage) sind klein und werden behalten
                images = [titleImage]
              } else {
                // Unbekanntes Format - versuche trotzdem zu verwenden
                images = [titleImage]
              }

              // OPTIMIERT: Nur URLs behalten, Base64 wird über Batch-API nachgeladen
              // KRITISCH: Behalte die ORIGINALE REIHENFOLGE - Titelbild ist IMMER zuerst!
              const urlImages = parsedImages.slice(1).filter((img: string) => {
                if (typeof img !== 'string') return false
                // Nur URLs behalten, Base64 wird über Batch-API nachgeladen
                return img.startsWith('http://') || img.startsWith('https://')
              })

              images = [...images, ...urlImages]
            }
          }
        } catch (error) {
          // Silent fail - Image parsing errors sollten nicht die Hauptfunktionalität blockieren
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
