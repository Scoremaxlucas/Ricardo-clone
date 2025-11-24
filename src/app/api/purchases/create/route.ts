import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceForSale } from '@/lib/invoice'
import { getShippingCost } from '@/lib/shipping'
import { addStatusHistory } from '@/lib/status-history'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { watchId, shippingMethod, price } = await request.json()

    if (!watchId) {
      return NextResponse.json(
        { message: 'WatchId ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob die Uhr existiert
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: { purchases: true }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Uhr nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob bereits ein Purchase für diese Uhr existiert (nur ein Kauf pro Uhr möglich)
    if (watch.purchases.length > 0) {
      return NextResponse.json(
        { message: 'Diese Uhr wurde bereits verkauft' },
        { status: 400 }
      )
    }

    // Prüfe ob der Käufer nicht der Verkäufer ist
    if (watch.sellerId === session.user.id) {
      return NextResponse.json(
        { message: 'Sie können nicht Ihre eigene Uhr kaufen' },
        { status: 400 }
      )
    }

    // Prüfe ob buyerId existiert
    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!buyer) {
      console.error(`[purchases/create] Käufer nicht gefunden: ${session.user.id}`)
      return NextResponse.json(
        { message: 'Käufer nicht gefunden' },
        { status: 404 }
      )
    }

    // Debug: Log IDs für Troubleshooting
    console.log(`[purchases/create] Erstelle Purchase: watchId=${watchId}, buyerId=${session.user.id}, sellerId=${watch.sellerId}`)

    // Aktiviere Foreign Keys für SQLite
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`
    } catch (e) {
      // Ignoriere Fehler wenn nicht SQLite
    }

    // Erstelle Purchase mit Status "pending" (Ricardo-Prozess)
    // Berechne Kontaktfrist (7 Tage nach Purchase)
    const contactDeadline = new Date()
    contactDeadline.setDate(contactDeadline.getDate() + 7)
    
    let purchase
    try {
      purchase = await prisma.purchase.create({
        data: {
          watchId,
          buyerId: session.user.id,
          shippingMethod: shippingMethod || null,
          price: price || watch.price,
          status: 'pending',
          itemReceived: false,
          paymentConfirmed: false,
          contactDeadline: contactDeadline // 7-Tage-Kontaktfrist
        },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                nickname: true,
                firstName: true,
                lastName: true,
                street: true,
                streetNumber: true,
                postalCode: true,
                city: true,
                country: true
              }
            }
          }
        },
        buyer: true
      }
      })
    } catch (createError: any) {
      console.error('[purchases/create] Fehler beim Erstellen des Purchases:', createError)
      console.error('[purchases/create] Fehler-Details:', {
        watchId,
        buyerId: session.user.id,
        watchExists: !!watch,
        buyerExists: !!buyer,
        errorMessage: createError.message,
        errorCode: createError.code
      })
      throw createError
    }

    console.log(`[purchases/create] Purchase erstellt: ${purchase.id} für Watch ${watchId} von ${session.user.email}`)
    console.log(`[purchases/create] Status: pending - Käufer muss innerhalb von 14 Tagen zahlen`)

    // Füge initialen Status zur Historie hinzu
    try {
      await addStatusHistory(
        purchase.id,
        'pending',
        session.user.id,
        'Purchase erstellt'
      )
    } catch (error) {
      console.error('[purchases/create] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // RICARDO-STYLE: Erstelle Rechnung SOFORT nach erfolgreichem Verkauf
    // Die Kommission wird direkt berechnet, auch wenn der Käufer noch nicht gezahlt hat
    // Falls der Käufer nicht innerhalb von 14 Tagen zahlt, kann der Verkäufer stornieren und Rückerstattung beantragen
    // calculateInvoiceForSale sendet automatisch E-Mail und erstellt Plattform-Benachrichtigung
    let invoice = null
    try {
      invoice = await calculateInvoiceForSale(purchase.id)
      console.log(`[purchases/create] ✅ Rechnung erstellt: ${invoice.invoiceNumber} für Seller ${purchase.watch.sellerId} (Ricardo-Style: sofort nach Verkauf)`)
    } catch (invoiceError: any) {
      console.error('[purchases/create] ❌ Fehler bei Rechnungserstellung:', invoiceError)
      // Fehler wird geloggt, aber Purchase bleibt bestehen
      // Verkäufer kann später manuell Rechnung erstellen lassen
    }

    // RICARDO-STYLE: Erstelle Benachrichtigung für Verkäufer
    try {
      const buyer = purchase.buyer
      const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Ein Käufer'
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'PURCHASE',
          title: 'Ihr Artikel wurde verkauft',
          message: `${buyerName} hat "${watch.title}" für CHF ${(purchase.price || watch.price).toFixed(2)} gekauft`,
          watchId: watchId,
          link: `/my-watches/selling/sold`
        }
      })
      console.log(`[purchases/create] ✅ Verkaufs-Benachrichtigung für Seller ${watch.sellerId} erstellt`)
    } catch (notificationError: any) {
      console.error('[purchases/create] ❌ Fehler beim Erstellen der Verkaufs-Benachrichtigung:', notificationError)
      // Fehler sollte den Kauf nicht verhindern
    }

    // RICARDO-STYLE: Sende Bestätigungs-E-Mail an Käufer
    try {
      const { sendEmail, getPurchaseConfirmationEmail } = await import('@/lib/email')
      const buyer = purchase.buyer
      const seller = purchase.watch.seller
      const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
      const sellerName = seller.nickname || seller.firstName || seller.name || seller.email || 'Verkäufer'
      
      // Berechne Versandkosten
      const shippingMethod = purchase.shippingMethod || watch.shippingMethod
      let shippingMethods: any = null
      try {
        if (shippingMethod) {
          shippingMethods = typeof shippingMethod === 'string' ? JSON.parse(shippingMethod) : shippingMethod
        }
      } catch {
        shippingMethods = null
      }
      const shippingCost = getShippingCost(shippingMethods)
      
      const { subject, html, text } = getPurchaseConfirmationEmail(
        buyerName,
        sellerName,
        watch.title,
        purchase.price || watch.price,
        shippingCost,
        watch.isAuction ? 'auction' : 'buy-now',
        purchase.id,
        watchId
      )
      
      await sendEmail({
        to: buyer.email,
        subject,
        html,
        text
      })
      
      console.log(`[purchases/create] ✅ Kaufbestätigungs-E-Mail gesendet an Käufer ${buyer.email}`)
    } catch (emailError: any) {
      console.error('[purchases/create] ❌ Fehler beim Senden der Kaufbestätigungs-E-Mail:', emailError)
      // E-Mail-Fehler sollte den Kauf nicht verhindern
    }

    return NextResponse.json({
      message: 'Kauf erfolgreich abgeschlossen. Die Kommission wurde berechnet.',
      purchase: {
        id: purchase.id,
        watchId: purchase.watchId,
        shippingMethod: purchase.shippingMethod,
        price: purchase.price,
        createdAt: purchase.createdAt
      },
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total
      } : null
    })
  } catch (error: any) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Kaufs: ' + error.message },
      { status: 500 }
    )
  }
}

