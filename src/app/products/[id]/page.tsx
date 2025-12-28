import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import dynamicImport from 'next/dynamic'
import { redirect } from 'next/navigation'

// Force dynamic rendering - no caching for product pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

// OPTIMIERT: Dynamic Import für große Komponente - reduziert initial Bundle Size
const ProductPageClient = dynamicImport(
  () => import('@/components/product/ProductPageClient').then(mod => mod.ProductPageClient),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Lade Produkt...</div>
      </div>
    ),
    ssr: true,
  }
)

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: Props) {
  try {
    // WICHTIG: In Next.js 15+ müssen params awaited werden
    const { id } = await params

    if (!id) {
      console.error('[ProductPage] No ID provided in params')
      return (
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Header />
          <main className="flex-1 pb-8">
            <ProductPageClient
              watch={null}
              images={[]}
              conditionMap={{}}
              lieferumfang=""
              seller={null}
            />
          </main>
          <Footer />
        </div>
      )
    }

    // Prüfe ob params.id eine Artikelnummer ist (numerisch)
    const isNumeric = /^\d+$/.test(id)
    const isArticleNumber = /^\d{6,10}$/.test(id)

    console.log(
      `[ProductPage] Looking for product with ID: ${id}, isNumeric: ${isNumeric}, isArticleNumber: ${isArticleNumber}`
    )

    // SIMPLIFIED: Find watch by ID or articleNumber
    let watch = null

    // Try to find the watch - first by ID, then by articleNumber if numeric
    try {
      // Always try by ID first (works for both CUID and numeric strings)
      watch = await prisma.watch.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              postalCode: true,
              verified: true,
            },
          },
        },
      })

      // If not found and ID is numeric, try as articleNumber
      if (!watch && isNumeric) {
        console.log(`[ProductPage] Not found by ID, trying articleNumber: ${parseInt(id)}`)
        watch = await prisma.watch.findUnique({
          where: { articleNumber: parseInt(id) },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                city: true,
                postalCode: true,
                verified: true,
              },
            },
          },
        })
      }
    } catch (dbError: unknown) {
      const err = dbError as Error
      console.error(`[ProductPage] Database error:`, err.message)
      // Continue - watch will be null
    }

    // DEBUG: Log the result
    if (watch) {
      console.log(
        `[ProductPage] Found: ${watch.title} (ID: ${watch.id}, ArticleNumber: ${watch.articleNumber})`
      )
    } else {
      console.log(`[ProductPage] NOT FOUND for ID: ${id}`)
    }

    // WICHTIG: Erlaube sowohl CUID als auch Artikelnummer-URLs
    // Redirect nur wenn Artikelnummer-URL verwendet wurde, aber nicht mit der gefundenen übereinstimmt
    // CUID-URLs sollten funktionieren ohne Redirect, um Race Conditions zu vermeiden
    if (watch && isArticleNumber && watch.articleNumber && watch.articleNumber.toString() !== id) {
      // Nur redirect wenn Artikelnummer-URL verwendet wurde und nicht übereinstimmt
      redirect(`/products/${watch.articleNumber}`)
    }

    // KEIN Redirect von CUID zu Artikelnummer mehr - beide URLs sollen funktionieren
    // Dies verhindert Race Conditions und "not found" Fehler

    if (!watch) {
      console.error(
        `[ProductPage] Product not found with ID: ${id}, isArticleNumber: ${isArticleNumber}`
      )

      // WICHTIG: Versuche auch eine Suche nach ähnlichen IDs für Debugging
      try {
        const similarWatches = await prisma.watch.findMany({
          where: {
            OR: [{ id: { contains: id.substring(0, 10) } }, { title: { contains: id } }],
          },
          take: 5,
          select: {
            id: true,
            articleNumber: true,
            title: true,
          },
        })
        console.error(`[ProductPage] Similar watches found:`, similarWatches)
      } catch (searchError) {
        console.error(`[ProductPage] Error searching for similar watches:`, searchError)
      }

      return (
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Header />
          <main className="flex-1 pb-8">
            <ProductPageClient
              watch={null}
              images={[]}
              conditionMap={{}}
              lieferumfang=""
              seller={null}
            />
          </main>
          <Footer />
        </div>
      )
    }

    // KRITISCH: Prüfe ob Produkt deaktiviert wurde (moderationStatus: 'rejected')
    // Deaktivierte Produkte sollten nicht angezeigt werden
    if (watch && watch.moderationStatus === 'rejected') {
      console.log(`[ProductPage] Product ${id} is deactivated (rejected), showing 404`)
      return (
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Header />
          <main className="flex-1 pb-8">
            <div className="mx-auto max-w-[1400px] px-4 py-8">
              <ProductPageClient
                watch={null}
                images={[]}
                conditionMap={{}}
                lieferumfang=""
                seller={null}
              />
            </div>
          </main>
          <Footer />
        </div>
      )
    }

    console.log(
      `[ProductPage] Product found: ${watch.title} (ID: ${watch.id}, ArticleNumber: ${watch.articleNumber})`
    )

    // Prüfe ob Auktion abgelaufen ist und verarbeite sie falls nötig
    if (watch.auctionEnd && new Date(watch.auctionEnd) <= new Date()) {
      try {
        const hasPurchase = await prisma.purchase.findFirst({
          where: { watchId: watch.id },
        })

        if (!hasPurchase) {
          const highestBid = await prisma.bid.findFirst({
            where: { watchId: watch.id },
            orderBy: { amount: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  nickname: true,
                },
              },
            },
          })

          if (highestBid) {
            // Erstelle Purchase für den Gewinner mit Kontaktfrist (7 Tage)
            const contactDeadline = new Date()
            contactDeadline.setDate(contactDeadline.getDate() + 7)

            await prisma.purchase.create({
              data: {
                watchId: watch.id,
                buyerId: highestBid.userId,
                price: highestBid.amount, // Setze den Preis auf das höchste Gebot
                contactDeadline: contactDeadline,
                status: 'pending',
              },
            })
          }
        }
      } catch (error) {
        // Silently fail - don't block page render if auction processing fails
        console.error('Error processing expired auction:', error)
      }
    }

    let images: string[] = []
    try {
      images = watch.images ? JSON.parse(watch.images) : []
    } catch (error) {
      console.error('Error parsing images:', error)
      images = []
    }

    const conditionMap: Record<string, string> = {
      'fabrikneu-verklebt': 'Fabrikneu und verklebt',
      ungetragen: 'Ungetragen',
      'wie-neu': 'Wie neu',
      'leichte-tragespuren':
        'Leichte Tragespuren (Mikrokratzer aber keine Dellen oder grössere Kratzer)',
      tragespuren: 'Tragespuren (grössere Kratzer, teilweise leichte Dellen)',
      'stark-gebraucht': 'Stark gebraucht',
    }

    const lieferumfang = (() => {
      if (watch.fullset) return 'Fullset (Box, Papiere, alle Glieder und Kaufbeleg)'
      const hasBox = (watch as any).box === true
      const hasPapers = (watch as any).papers === true
      if (hasBox && hasPapers) return 'Nur Box und Papiere'
      if (hasBox) return 'Nur Box'
      if (hasPapers) return 'Nur Papiere'
      return 'Keine Angaben'
    })()

    const seller = watch.seller || {
      id: watch.sellerId,
      name: 'Unbekannt',
      email: '',
      city: 'Zürich',
      postalCode: '8000',
      verified: false,
    }

    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-8">
          <div className="mx-auto max-w-[1400px] px-4 py-8">
            <ProductPageClient
              watch={{
                ...watch,
                video: watch.video || null,
              }}
              images={images}
              conditionMap={conditionMap}
              lieferumfang={lieferumfang}
              seller={seller}
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error('Error fetching product:', error)
    // Return error state instead of crashing
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-8">
          <div className="mx-auto max-w-[1400px] px-4 py-8">
            <ProductPageClient
              watch={null}
              images={[]}
              conditionMap={{}}
              lieferumfang=""
              seller={null}
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  }
}
