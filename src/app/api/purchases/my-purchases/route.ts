import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Alle Käufe des eingeloggten Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole alle Purchases des Users
    const purchases = await prisma.purchase.findMany({
      where: { buyerId: session.user.id },
      include: {
        watch: {
          include: {
            seller: {
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
                paymentMethods: true
              }
            },
            bids: {
              orderBy: { amount: 'desc' },
              take: 1 // Höchstes Gebot (das Gewinner-Gebot)
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`[my-purchases] User ${session.user.id} (${session.user.email}) hat ${purchases.length} Purchases`)
    
    // Debug: Zeige alle Purchase-IDs und buyerIds
    if (purchases.length > 0) {
      console.log(`[my-purchases] Purchase Details:`, purchases.map(p => ({
        id: p.id,
        buyerId: p.buyerId,
        watchId: p.watchId,
        watchTitle: p.watch.title,
        createdAt: p.createdAt
      })))
    } else {
      // Prüfe ob es Purchases mit anderen buyerIds gibt (zum Debugging)
      const allPurchases = await prisma.purchase.findMany({
        take: 10,
        select: {
          id: true,
          buyerId: true,
          watchId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
      console.log(`[my-purchases] Letzte 10 Purchases in DB:`, allPurchases)
      
      // Prüfe ob der User existiert
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true }
      })
      console.log(`[my-purchases] User in DB gefunden:`, user)
      
      // Prüfe ob es Purchases gibt, die zu diesem User gehören sollten
      const purchasesForUser = await prisma.purchase.findMany({
        where: { buyerId: session.user.id },
        select: { id: true, buyerId: true, watchId: true }
      })
      console.log(`[my-purchases] Direkte Abfrage für buyerId=${session.user.id}:`, purchasesForUser.length, 'Purchases')
    }

    // Formatiere Daten
    const purchasesWithDetails = purchases.map(purchase => {
      try {
        const watch = purchase.watch
        let images: string[] = []
        
        // Parse images safely
        try {
          if (watch.images) {
            // Prüfe ob es bereits ein Array ist (String)
            if (typeof watch.images === 'string') {
              // Versuche JSON zu parsen
              if (watch.images.startsWith('[') || watch.images.startsWith('{')) {
                images = JSON.parse(watch.images)
              } else {
                // Falls es ein komma-separiertes String ist
                images = watch.images.split(',').filter(img => img.trim().length > 0)
              }
            } else if (Array.isArray(watch.images)) {
              images = watch.images
            }
          }
        } catch (imgError) {
          console.error(`[my-purchases] Fehler beim Parsen der Bilder für Watch ${watch.id}:`, imgError)
          images = []
        }
        
        const winningBid = watch.bids[0]

        // Bestimme finalPrice und purchaseType
        const finalPrice = winningBid?.amount || purchase.price || watch.price
        // Wenn buyNowPrice existiert und das Gewinner-Gebot gleich dem buyNowPrice ist, dann ist es ein Sofortkauf
        // Ansonsten ist es eine Auktion
        const isBuyNow = watch.buyNowPrice && winningBid && winningBid.amount === watch.buyNowPrice
        const purchaseType = isBuyNow ? 'buy-now' : (winningBid ? 'auction' : 'buy-now')

        return {
          id: purchase.id,
          purchasedAt: purchase.createdAt,
          shippingMethod: watch.shippingMethod,
          paid: purchase.paid || false,
          watch: {
            id: watch.id,
            title: watch.title,
            brand: watch.brand,
            model: watch.model,
            images: images,
            seller: watch.seller,
            price: watch.price,
            finalPrice: finalPrice,
            purchaseType: purchaseType
          }
        }
      } catch (error) {
        console.error(`[my-purchases] Fehler beim Formatieren von Purchase ${purchase.id}:`, error)
        return null
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null) // Entferne null-Einträge

    return NextResponse.json({ purchases: purchasesWithDetails })
  } catch (error: any) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Käufe: ' + error.message },
      { status: 500 }
    )
  }
}

