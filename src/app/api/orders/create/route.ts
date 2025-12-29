import { authOptions } from '@/lib/auth'
import { calculateOrderFees } from '@/lib/order-fees'
import { prisma } from '@/lib/prisma'
import { calculateShippingCost, ShippingSelection } from '@/lib/shipping-calculator'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/create
 * Erstellt eine neue Order für Zahlungsschutz
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
        seller: {
          select: {
            id: true,
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
      return NextResponse.json({ message: 'Uhr nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits eine aktive Order für DIESEN Käufer existiert
    const existingOrder = watch.orders.find(
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
        { message: 'Sie können nicht Ihre eigene Uhr kaufen' },
        { status: 400 }
      )
    }

    // JUST-IN-TIME ONBOARDING: Keine Prüfung ob Verkäufer Stripe hat
    // Die Zahlung geht an Helvenda (Platform), Auszahlung an Verkäufer erfolgt später
    // Verkäufer muss Stripe erst einrichten wenn er die Auszahlung erhalten möchte

    // Berechne Preise
    const itemPrice = watch.buyNowPrice || watch.price
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
    const fees = await calculateOrderFees(itemPrice, shippingCostChfFinal, true)

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

    // Erstelle Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        watchId,
        buyerId,
        sellerId: watch.sellerId,
        itemPrice: fees.itemPrice,
        shippingCost: shippingCostChfFinal, // Deprecated - use shippingCostChfFinal
        shippingCostChfFinal,
        shippingCostBreakdown: JSON.stringify(shippingCostBreakdown),
        selectedDeliveryMode,
        selectedShippingCode: shippingCode,
        selectedAddons: selectedAddons ? JSON.stringify(selectedAddons) : null,
        shippingRateSetId: 'default_ch_post',
        platformFee: fees.platformFee,
        protectionFee: fees.protectionFee,
        totalAmount: fees.totalAmount,
        orderStatus: 'awaiting_payment',
        paymentStatus: 'created',
      },
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

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Bestellung',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
