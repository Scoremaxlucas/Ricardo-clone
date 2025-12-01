import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateArticleNumber } from '@/lib/article-number'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe Verifizierungsstatus
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true, verified: true },
    })

    if (!user || user.verificationStatus !== 'approved' || !user.verified) {
      return NextResponse.json(
        { message: 'Sie müssen verifiziert sein, um Artikel zu verkaufen.' },
        { status: 403 }
      )
    }

    const { products } = await request.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { message: 'Keine Artikel zum Erstellen übergeben.' },
        { status: 400 }
      )
    }

    if (products.length > 100) {
      return NextResponse.json(
        { message: 'Maximal 100 Artikel können gleichzeitig erstellt werden.' },
        { status: 400 }
      )
    }

    const createdProducts = []
    const errors = []

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      try {
        // Validierung
        if (!product.title || !product.description || !product.price || !product.condition) {
          errors.push(`Artikel ${i + 1}: Fehlende Pflichtfelder`)
          continue
        }

        const priceFloat = parseFloat(product.price)
        if (isNaN(priceFloat) || priceFloat <= 0) {
          errors.push(`Artikel ${i + 1}: Ungültiger Preis`)
          continue
        }

        const buyNowPriceFloat = product.buyNowPrice ? parseFloat(product.buyNowPrice) : null
        if (product.buyNowPrice && (isNaN(buyNowPriceFloat!) || buyNowPriceFloat! <= 0)) {
          errors.push(`Artikel ${i + 1}: Ungültiger Sofortkaufpreis`)
          continue
        }

        // Auktionsdaten
        let auctionEndDate: Date | null = null
        if (product.isAuction && product.auctionDuration) {
          const duration = parseInt(product.auctionDuration)
          if (duration > 0 && duration <= 30) {
            auctionEndDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
          }
        }

        // Shipping Methods
        const shippingMethods =
          product.shippingMethods &&
          Array.isArray(product.shippingMethods) &&
          product.shippingMethods.length > 0
            ? product.shippingMethods
            : ['pickup'] // Fallback

        // Bilder verarbeiten (Base64 Strings)
        const images =
          product.images && Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : []

        // Jahr konvertieren
        const yearInt = product.year ? parseInt(product.year) : null

        // Booster verarbeiten
        let boostersArray: string[] = []
        if (product.booster && product.booster !== 'none') {
          boostersArray = [product.booster]
        }

        // Generiere eindeutige Artikelnummer
        let articleNumber: number | undefined
        try {
          articleNumber = await generateArticleNumber()
        } catch (error) {
          console.error('Error generating article number:', error)
        }

        // Erstelle Artikel
        const watchData: any = {
          title: product.title,
          description: product.description,
          brand: product.brand || '',
          model: product.model || '',
          year: yearInt,
          condition: product.condition,
          price: priceFloat,
          buyNowPrice: buyNowPriceFloat,
          isAuction: !!auctionEndDate,
          auctionEnd: auctionEndDate,
          auctionDuration: product.auctionDuration ? parseInt(product.auctionDuration) : null,
          images: JSON.stringify(images),
          shippingMethod: JSON.stringify(shippingMethods),
          boosters: boostersArray.length > 0 ? JSON.stringify(boostersArray) : null,
          articleNumber: articleNumber,
          sellerId: session.user.id,
        }

        const created = await prisma.watch.create({
          data: watchData,
        })

        // Kategorien zuweisen falls vorhanden
        if (product.category) {
          // Normalisiere den Category-Slug
          const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-')

          const category = await prisma.category.findFirst({
            where: {
              OR: [
                { slug: categorySlug },
                { slug: product.category },
                { name: { equals: product.category, mode: 'insensitive' } },
              ],
            },
          })

          if (category) {
            await prisma.watchCategory.create({
              data: {
                watchId: created.id,
                categoryId: category.id,
              },
            })
          } else {
            console.warn(`Kategorie nicht gefunden: ${product.category}`)
          }
        }

        createdProducts.push(created.id)
      } catch (error: any) {
        console.error(`Error creating product ${i + 1}:`, error)
        errors.push(`Artikel ${i + 1}: ${error.message || 'Unbekannter Fehler'}`)
      }
    }

    return NextResponse.json({
      message: `${createdProducts.length} Artikel erfolgreich erstellt.`,
      created: createdProducts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Bulk create error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Artikel: ' + error.message },
      { status: 500 }
    )
  }
}
