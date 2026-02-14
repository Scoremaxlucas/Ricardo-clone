import { authOptions } from '@/lib/auth'
import { createInvoiceForOrderWithTransaction } from '@/lib/invoice'
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
    console.log('[orders/create] Starting order creation...')

    // Quick DB health check
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('[orders/create] Database connection OK')
    } catch (dbError: unknown) {
      console.error('[orders/create] Database connection failed:', dbError)
      const msg = dbError instanceof Error ? dbError.message : 'Ein Fehler ist aufgetreten'
      return NextResponse.json(
        { message: 'Datenbankverbindung fehlgeschlagen', error: msg },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    console.log('[orders/create] Session:', session?.user?.id ? 'OK' : 'MISSING')

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
    console.log('[orders/create] BuyerId:', buyerId)

    // Lade Watch mit Verkäufer - use select to avoid missing columns
    console.log('[orders/create] Loading watch:', watchId)
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
      console.error('[orders/create] Watch not found:', watchId)
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }
    console.log('[orders/create] Watch loaded:', { id: watch.id, price: watch.price, buyNowPrice: watch.buyNowPrice, sellerId: watch.sellerId })

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
    } catch (feeError: unknown) {
      console.error('[orders/create] Fee calculation error:', feeError)
      const msg = feeError instanceof Error ? feeError.message : 'Ein Fehler ist aufgetreten'
      return NextResponse.json(
        { message: 'Fehler bei der Gebührenberechnung', error: msg },
        { status: 500 }
      )
    }

    const year = new Date().getFullYear()

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
    // HINWEIS: protectionFee speichert die Zahlungsgebühr (Stripe Fee)
    // Bei Abholung (cash_on_pickup): KEINE Stripe-Gebühren, da keine Online-Zahlung!
    // Die 5% Plattform-Kommission gilt unabhängig von der Zahlungsmethode.
    const actualProtectionFee = isPickup ? 0 : fees._processingFeeOnly

    const orderData = {
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
      protectionFee: actualProtectionFee, // 0 bei Abholung, sonst Stripe-Gebühr
      totalAmount: fees.totalAmount,
      paymentMethod,
      orderStatus,
      paymentStatus,
      paymentDeadline: paymentMethod !== 'stripe' ? paymentDeadline : null,
      contactDeadline: contactDeadline,
    }
    console.log('[orders/create] Creating order with data:', JSON.stringify(orderData, null, 2))

    // Transaction: Order + Invoice + Order-Update + PURCHASE-Notification atomar
    let order: Awaited<ReturnType<typeof prisma.order.create>>
    let invoice: Awaited<ReturnType<typeof createInvoiceForOrderWithTransaction>> | null = null
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Order-Nummer innerhalb Transaktion (Race-Sicherheit)
        const lastOrder = await tx.order.findFirst({
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
        console.log('[orders/create] Generated order number:', orderNumber)

        const orderDataWithNumber = { ...orderData, orderNumber }

        const createdOrder = await tx.order.create({
          data: orderDataWithNumber,
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

        // Rechnung sofort erstellen (atomar mit Order)
        const createdInvoice = await createInvoiceForOrderWithTransaction(tx, createdOrder)

        await tx.order.update({
          where: { id: createdOrder.id },
          data: {
            invoiceId: createdInvoice.id,
            invoiceCreatedAt: new Date(),
          },
        })

        // PURCHASE-Benachrichtigung (DB) – innerhalb Transaktion
        const buyerName = createdOrder.buyer.name || createdOrder.buyer.email || 'Ein Käufer'
        await tx.notification.create({
          data: {
            userId: watch.sellerId,
            type: 'PURCHASE',
            title: 'Ihr Artikel wurde verkauft!',
            message: `${buyerName} hat "${createdOrder.watch.title}" für CHF ${createdOrder.totalAmount.toFixed(2)} gekauft.`,
            watchId: watchId,
            link: `/my-watches/selling/sold`,
          },
        })

        console.log(`[orders/create] ✅ Rechnung ${createdInvoice.invoiceNumber} erstellt für Order ${createdOrder.id} (sofort nach Verkauf)`)

        return { order: createdOrder, invoice: createdInvoice }
      })

      order = result.order
      invoice = result.invoice
    } catch (prismaError: unknown) {
      console.error('[orders/create] Prisma error creating order:', prismaError)
      const prismaErr = prismaError as { code?: string; meta?: unknown; message?: string }
      console.error('[orders/create] Prisma error code:', prismaErr.code)
      console.error('[orders/create] Prisma error meta:', prismaErr.meta)
      const msg =
        prismaError instanceof Error ? prismaError.message : 'Ein Fehler ist aufgetreten'
      return NextResponse.json(
        {
          message: 'Datenbankfehler beim Erstellen der Bestellung',
          error: msg,
          code: prismaErr.code
        },
        { status: 500 }
      )
    }

    // === E-MAIL-BENACHRICHTIGUNGEN (außerhalb Transaktion) ===

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
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    const err = error instanceof Error ? error : null
    const errObj = error as { code?: string; stack?: string }
    if (err) {
      console.error('Error stack:', err.stack)
      console.error('Error name:', err.name)
    }
    console.error('Error code:', errObj.code)
    const message = err?.message ?? 'Ein Fehler ist aufgetreten'
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Bestellung',
        error: message,
        code: errObj.code,
        details: process.env.NODE_ENV === 'development' ? errObj.stack : undefined,
      },
      { status: 500 }
    )
  }
}
