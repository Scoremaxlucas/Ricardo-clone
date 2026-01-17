import { authOptions } from '@/lib/auth'
import { calculateOrderFees } from '@/lib/order-fees'
import { prisma } from '@/lib/prisma'
import { calculateShippingCost, ShippingSelection } from '@/lib/shipping-calculator'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/create
 * Erstellt eine neue Order - EINHEITLICH für alle Szenarien:
 * - Abholung (cash_on_pickup)
 * - Versand ohne Schutz (bank_transfer)
 * - Versand mit Schutz (stripe)
 *
 * Ricardo-Style: 14-Tage-Zahlungsfrist für Direktzahlungen
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const {
      watchId,
      shippingMethod, // Deprecated - use shippingSelection
      purchaseId,
      // New shipping fields
      selectedDeliveryMode, // 'shipping' | 'pickup'
      selectedShippingCode, // e.g. 'post_economy_2kg'
      selectedAddons, // ['sperrgut', 'pickhome']
    } = await request.json()

    if (!watchId) {
      return NextResponse.json({ message: 'watchId ist erforderlich' }, { status: 400 })
    }

    if (!selectedDeliveryMode) {
      return NextResponse.json(
        { message: 'selectedDeliveryMode ist erforderlich' },
        { status: 400 }
      )
    }

    const buyerId = session.user.id

    // Lade Watch mit Verkäufer - use select to avoid missing columns
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      select: {
        id: true,
        title: true,
        price: true,
        buyNowPrice: true,
        sellerId: true,
        shippingMethod: true,
        paymentProtectionEnabled: true, // Wichtig für Zahlungsmethode
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        orders: {
          where: {
            buyerId: buyerId, // Only check orders for THIS buyer
            orderStatus: {
              not: 'canceled',
            },
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits eine aktive Order für DIESEN Käufer existiert
    const existingOrder = (watch.orders || []).find(
      o => o.orderStatus !== 'canceled' && o.paymentStatus !== 'refunded'
    )

    // If an active order exists for this buyer, return it (idempotent)
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        order: {
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          totalAmount: existingOrder.totalAmount,
          orderStatus: existingOrder.orderStatus,
          paymentStatus: existingOrder.paymentStatus,
        },
        existing: true, // Indicate this was an existing order
      })
    }

    // Prüfe ob Käufer nicht Verkäufer ist
    if (watch.sellerId === buyerId) {
      return NextResponse.json(
        { message: 'Sie können nicht Ihren eigenen Artikel kaufen' },
        { status: 400 }
      )
    }

    // JUST-IN-TIME ONBOARDING: Keine Prüfung ob Verkäufer Stripe hat
    // Die Zahlung geht an Helvenda (Platform), Auszahlung an Verkäufer erfolgt später
    // Verkäufer muss Stripe erst einrichten wenn er die Auszahlung erhalten möchte

    // Berechne Preise
    const itemPrice = watch.buyNowPrice || watch.price

    // Validate item price
    if (!itemPrice || itemPrice <= 0) {
      console.error('[orders/create] Invalid item price:', {
        buyNowPrice: watch.buyNowPrice,
        price: watch.price,
        watchId
      })
      return NextResponse.json(
        { message: 'Artikel hat keinen gültigen Preis' },
        { status: 400 }
      )
    }
    let shippingCostChfFinal = 0
    let shippingCostBreakdown: any = {
      base: 0,
      sperrgut: 0,
      pickhome: 0,
      freeShippingApplied: false,
    }
    let shippingCode = selectedShippingCode || null

    // Berechne Versandkosten (nur wenn Versand gewählt)
    if (selectedDeliveryMode === 'shipping' && selectedShippingCode) {
      // Parse shipping code (z.B. 'post_economy_2kg')
      const match = selectedShippingCode.match(/post_(economy|priority)_(\d+)kg/)
      if (!match) {
        return NextResponse.json({ message: 'Ungültiger shippingCode' }, { status: 400 })
      }

      const [, service, weightTierStr] = match
      const weightTier = parseInt(weightTierStr) as 2 | 10 | 30

      // Note: shippingProfile and freeShippingThresholdChf columns don't exist in DB
      // Using default values for shipping calculation
      const allowedAddons = {
        sperrgut: false,
        pickhome: false,
      }

      // Build selection
      const selection: ShippingSelection = {
        service: service as 'economy' | 'priority',
        weightTier,
        addons: {
          sperrgut: selectedAddons?.includes('sperrgut') && allowedAddons.sperrgut,
          pickhome: selectedAddons?.includes('pickhome') && allowedAddons.pickhome,
        },
      }

      // Calculate shipping cost (no free shipping threshold available)
      const shippingResult = await calculateShippingCost(
        selection,
        itemPrice,
        null, // freeShippingThresholdChf not available
        allowedAddons
      )

      shippingCostChfFinal = shippingResult.total
      shippingCostBreakdown = shippingResult.breakdown
      shippingCode = shippingResult.shippingCode
    } else if (selectedDeliveryMode === 'pickup') {
      // Abholung = kostenlos
      shippingCostChfFinal = 0
      shippingCostBreakdown = {
        base: 0,
        sperrgut: 0,
        pickhome: 0,
        freeShippingApplied: false,
      }
    } else {
      // Fallback für alte API-Calls
      const legacyShippingCost = shippingMethod
        ? (await import('@/lib/shipping')).getShippingCostForMethod(shippingMethod as any)
        : 0
      shippingCostChfFinal = legacyShippingCost
    }

    // Berechne Gebühren
    console.log('[orders/create] Calculating fees for:', { itemPrice, shippingCostChfFinal })
    let fees
    try {
      fees = await calculateOrderFees(itemPrice, shippingCostChfFinal, true)
    } catch (feeError: any) {
      console.error('[orders/create] Fee calculation error:', feeError)
      return NextResponse.json(
        { message: 'Fehler bei der Gebührenberechnung', error: feeError.message },
        { status: 500 }
      )
    }

    // Generiere Order-Nummer
    const year = new Date().getFullYear()
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD-${year}-`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    })

    let orderNumber = `ORD-${year}-001`
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2])
      if (!isNaN(lastNumber) && lastNumber > 0) {
        orderNumber = `ORD-${year}-${String(lastNumber + 1).padStart(3, '0')}`
      }
    }

    // === RICARDO-STYLE: Bestimme Zahlungsmethode und Fristen ===
    const isPickup = selectedDeliveryMode === 'pickup'
    const hasPaymentProtection = watch.paymentProtectionEnabled && !isPickup

    // Zahlungsmethode bestimmen
    let paymentMethod: 'stripe' | 'bank_transfer' | 'cash_on_pickup'
    if (isPickup) {
      paymentMethod = 'cash_on_pickup'
    } else if (hasPaymentProtection) {
      paymentMethod = 'stripe'
    } else {
      paymentMethod = 'bank_transfer'
    }

    // Fristen berechnen
    const now = new Date()

    // 14-Tage-Zahlungsfrist für Direktzahlungen (Banküberweisung)
    // Für Abholung gilt auch 14 Tage - Käufer muss Verkäufer kontaktieren
    const paymentDeadline = new Date(now)
    paymentDeadline.setDate(paymentDeadline.getDate() + 14)

    // 7-Tage-Kontaktfrist (Käufer soll Verkäufer innerhalb von 7 Tagen kontaktieren)
    const contactDeadline = new Date(now)
    contactDeadline.setDate(contactDeadline.getDate() + 7)

    // Status basierend auf Zahlungsmethode
    let orderStatus: string
    let paymentStatus: string

    if (paymentMethod === 'stripe') {
      // Stripe: Warten auf Zahlung über Stripe Checkout
      orderStatus = 'awaiting_payment'
      paymentStatus = 'created'
    } else if (paymentMethod === 'cash_on_pickup') {
      // Abholung: Kauf ist verbindlich, Zahlung bei Übergabe
      orderStatus = 'confirmed'
      paymentStatus = 'pending_cash'
    } else {
      // Banküberweisung: Kauf ist verbindlich, warten auf Überweisung
      orderStatus = 'confirmed'
      paymentStatus = 'pending_bank_transfer'
    }

    // Erstelle Order
    // HINWEIS: protectionFee speichert jetzt die Zahlungsgebühr (Stripe Fee / "Helvenda Schutz Gebühr")
    // Diese wird vom Verkäufer bezahlt, nicht vom Käufer
    const orderData = {
      orderNumber,
      watchId,
      buyerId,
      sellerId: watch.sellerId,
      itemPrice: fees.itemPrice,
      shippingCost: shippingCostChfFinal,
      shippingCostChfFinal,
      shippingCostBreakdown: JSON.stringify(shippingCostBreakdown),
      selectedDeliveryMode,
      selectedShippingCode: shippingCode,
      selectedAddons: selectedAddons ? JSON.stringify(selectedAddons) : null,
      shippingRateSetId: 'default_ch_post',
      platformFee: fees.platformFee,
      protectionFee: fees._processingFeeOnly,
      totalAmount: fees.totalAmount,
      paymentMethod,
      orderStatus,
      paymentStatus,
      paymentDeadline: paymentMethod !== 'stripe' ? paymentDeadline : null,
      contactDeadline: contactDeadline,
    }
    console.log('[orders/create] Creating order with data:', JSON.stringify(orderData, null, 2))
    
    let order
    try {
      order = await prisma.order.create({
        data: orderData,
        include: {
          watch: {
            select: {
              id: true,
              title: true,
              brand: true,
              model: true,
              images: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } catch (prismaError: any) {
      console.error('[orders/create] Prisma error creating order:', prismaError)
      console.error('[orders/create] Prisma error code:', prismaError.code)
      console.error('[orders/create] Prisma error meta:', prismaError.meta)
      return NextResponse.json(
        { 
          message: 'Datenbankfehler beim Erstellen der Bestellung', 
          error: prismaError.message,
          code: prismaError.code 
        },
        { status: 500 }
      )
    }

    // === BENACHRICHTIGUNGEN SENDEN ===
    // Benachrichtigung an Verkäufer
    try {
      const buyerName = order.buyer.name || order.buyer.email || 'Ein Käufer'
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'PURCHASE',
          title: 'Ihr Artikel wurde verkauft!',
          message: `${buyerName} hat "${order.watch.title}" für CHF ${order.totalAmount.toFixed(2)} gekauft.`,
          watchId: watchId,
          link: `/my-watches/selling/sold`,
        },
      })
    } catch (notifyError) {
      console.error('[orders/create] Fehler bei Verkäufer-Benachrichtigung:', notifyError)
    }

    // E-Mail an Käufer mit Zahlungsinformationen (für Direktzahlungen)
    if (paymentMethod !== 'stripe') {
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/email-orders')
        await sendOrderConfirmationEmail(order.id)
      } catch (emailError) {
        console.error('[orders/create] Fehler bei Bestätigungs-E-Mail:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentDeadline: order.paymentDeadline,
      },
      // Info für Frontend
      requiresStripePayment: paymentMethod === 'stripe',
      isDirectPurchase: paymentMethod !== 'stripe',
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error code:', error.code)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Bestellung',
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
