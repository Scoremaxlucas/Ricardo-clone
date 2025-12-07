import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProductPageClient } from '@/components/product/ProductPageClient'

interface Props {
  params: { id: string }
}

export default async function ProductPage({ params }: Props) {
  try {
    // Prüfe ob params.id eine Artikelnummer ist (numerisch)
    const isArticleNumber = /^\d{6,10}$/.test(params.id)

    const watch = await prisma.watch.findUnique({
      where: isArticleNumber ? { articleNumber: parseInt(params.id) } : { id: params.id },
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

  // Wenn Artikelnummer gefunden, redirect zu Artikelnummer-URL
  if (
    watch &&
    isArticleNumber &&
    watch.articleNumber &&
    watch.articleNumber.toString() !== params.id
  ) {
    redirect(`/products/${watch.articleNumber}`)
  }

  // Wenn CUID verwendet wurde, aber Artikelnummer vorhanden ist, redirect zu Artikelnummer
  if (watch && !isArticleNumber && watch.articleNumber) {
    redirect(`/products/${watch.articleNumber}`)
  }

  if (!watch) {
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
