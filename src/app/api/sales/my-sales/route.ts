import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Alle Verkäufe des eingeloggten Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle Purchases, bei denen der eingeloggte User der Verkäufer ist
    // WICHTIG: Nur nicht-stornierte Purchases zählen als "verkauft"
    // Stornierte Purchases (z.B. durch Dispute) bedeuten, dass der Artikel wieder verfügbar ist
    const purchases = await prisma.purchase.findMany({
      where: {
        watch: {
          sellerId: session.user.id,
        },
        // Nur nicht-stornierte Purchases - stornierte bedeuten, dass der Artikel wieder verfügbar ist
        status: {
          not: 'cancelled',
        },
      },
      include: {
        watch: {
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              take: 1,
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            street: true,
            streetNumber: true,
            postalCode: true,
            city: true,
            phone: true,
            paymentMethods: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatiere Daten
    const salesWithDetails = purchases.map(purchase => {
      const watch = purchase.watch as any
      let images: string[] = []

      // Parse images safely
      try {
        if (watch.images) {
          if (typeof watch.images === 'string') {
            if (watch.images.startsWith('[') || watch.images.startsWith('{')) {
              images = JSON.parse(watch.images)
            } else {
              images = watch.images.split(',').filter((img: string) => img.trim().length > 0)
            }
          } else if (Array.isArray(watch.images)) {
            images = watch.images
          }
        }
      } catch (imgError) {
        console.error(`[my-sales] Fehler beim Parsen der Bilder für Watch ${watch.id}:`, imgError)
        images = []
      }

      const winningBid = watch.bids?.[0]

      // Bestimme finalPrice und purchaseType
      const finalPrice = winningBid?.amount || purchase.price || watch.price
      const isBuyNow = watch.buyNowPrice && winningBid && winningBid.amount === watch.buyNowPrice
      const purchaseType = isBuyNow ? 'buy-now' : winningBid ? 'auction' : 'buy-now'

      return {
        id: purchase.id,
        soldAt: purchase.createdAt,
        shippingMethod: purchase.shippingMethod || watch.shippingMethod,
        paid: purchase.paymentConfirmed || purchase.paid || false,
        paidAt: purchase.paymentConfirmedAt || purchase.paidAt,
        status: purchase.status || 'pending',
        itemReceived: purchase.itemReceived || false,
        itemReceivedAt: purchase.itemReceivedAt,
        paymentConfirmed: purchase.paymentConfirmed || false,
        paymentConfirmedAt: purchase.paymentConfirmedAt,
        // Kontaktfrist-Felder
        contactDeadline: purchase.contactDeadline?.toISOString() || null,
        sellerContactedAt: purchase.sellerContactedAt?.toISOString() || null,
        buyerContactedAt: purchase.buyerContactedAt?.toISOString() || null,
        contactWarningSentAt: purchase.contactWarningSentAt?.toISOString() || null,
        contactDeadlineMissed: purchase.contactDeadlineMissed || false,
        // Dispute-Felder
        disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
        disputeReason: purchase.disputeReason || null,
        disputeStatus: purchase.disputeStatus || null,
        disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        // Versand-Felder
        trackingNumber: purchase.trackingNumber || null,
        trackingProvider: purchase.trackingProvider || null,
        shippedAt: purchase.shippedAt?.toISOString() || null,
        estimatedDeliveryDate: purchase.estimatedDeliveryDate?.toISOString() || null,
        watch: {
          id: watch.id,
          title: watch.title,
          brand: watch.brand,
          model: watch.model,
          images: images,
          price: watch.price,
          finalPrice: finalPrice,
          purchaseType: purchaseType,
        },
        buyer: purchase.buyer,
      }
    })

    return NextResponse.json({ sales: salesWithDetails })
  } catch (error: any) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Verkäufe: ' + error.message },
      { status: 500 }
    )
  }
}
