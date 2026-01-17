import { getMainAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Get a single sale/purchase by ID (or watchId as fallback)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchId = params.id

    if (!searchId || searchId === 'undefined' || searchId === 'null') {
      console.log(`[sales] Invalid ID: ${searchId}`)
      return NextResponse.json({ message: 'Ungültige Verkaufs-ID' }, { status: 400 })
    }

    console.log(`[sales/${searchId}] Fetching purchase for seller ${session.user.id}`)

    // WICHTIG: Explizites select um disputeInitiatedBy zu vermeiden (P2022)
    const selectOptions = {
      id: true,
      watchId: true,
      buyerId: true,
      price: true,
      status: true,
      createdAt: true,
      shippingMethod: true,
      paid: true,
      paidAt: true,
      paymentConfirmed: true,
      paymentConfirmedAt: true,
      itemReceived: true,
      itemReceivedAt: true,
      contactDeadline: true,
      sellerContactedAt: true,
      buyerContactedAt: true,
      contactWarningSentAt: true,
      contactDeadlineMissed: true,
      disputeOpenedAt: true,
      disputeReason: true,
      disputeStatus: true,
      disputeResolvedAt: true,
      trackingNumber: true,
      trackingProvider: true,
      shippedAt: true,
      estimatedDeliveryDate: true,
      // disputeInitiatedBy wird NICHT selektiert (existiert möglicherweise noch nicht in DB)
      watch: {
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          images: true,
          price: true,
          buyNowPrice: true,
          shippingMethod: true,
          paymentProtectionEnabled: true,
          bids: {
            orderBy: { amount: 'desc' as const },
            take: 1,
            select: {
              id: true,
              amount: true,
            },
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
          phone: true,
          paymentMethods: true,
        },
      },
    }

    // Try to find by purchaseId first
    let purchase = await prisma.purchase.findFirst({
      where: {
        id: searchId,
        watch: {
          sellerId: session.user.id,
        },
      },
      select: selectOptions,
    })

    // If not found, try by watchId
    if (!purchase) {
      console.log(`[sales/${searchId}] Not found by purchaseId, trying watchId...`)
      purchase = await prisma.purchase.findFirst({
        where: {
          watchId: searchId,
          watch: {
            sellerId: session.user.id,
          },
          status: { not: 'cancelled' },
        },
        select: selectOptions,
      })
    }

    // If still not found by purchaseId, try to find by orderId (new system)
    if (!purchase) {
      console.log(`[sales/${searchId}] Not found by purchaseId/watchId, trying orderId...`)

      // Try to find an order directly
      const order = await prisma.order.findFirst({
        where: {
          id: searchId,
          sellerId: session.user.id,
        },
        include: {
          watch: {
            select: {
              id: true,
              title: true,
              brand: true,
              model: true,
              images: true,
              price: true,
              buyNowPrice: true,
              shippingMethod: true,
              paymentProtectionEnabled: true,
              bids: {
                orderBy: { amount: 'desc' as const },
                take: 1,
                select: {
                  id: true,
                  amount: true,
                },
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
              phone: true,
              paymentMethods: true,
            },
          },
        },
      })

      if (order) {
        console.log(`[sales/${searchId}] Found order ${order.id} for watch: ${order.watch.title}`)

        const watch = order.watch as any
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
        } catch {
          images = []
        }

        const paymentProtectionEnabled = watch.paymentProtectionEnabled || false
        const isPaidViaStripe = order.paymentStatus === 'paid' || order.paymentStatus === 'released'

        // Fetch buyer address from UserAddress table
        const buyerAddress = order.buyer ? await getMainAddress(order.buyer.id) : null
        const buyerWithAddress = order.buyer
          ? {
              ...order.buyer,
              street: buyerAddress?.street || null,
              streetNumber: buyerAddress?.streetNumber || null,
              postalCode: buyerAddress?.postalCode || null,
              city: buyerAddress?.city || null,
            }
          : null

        // Build sale from Order data
        // Note: Some fields from Purchase model don't exist in Order model
        // We use safe defaults for those fields
        const contactDeadline = order.contactDeadline
        const contactDeadlineMissed = contactDeadline ? new Date() > new Date(contactDeadline) : false

        const saleFromOrder = {
          id: order.id,
          soldAt: order.createdAt,
          shippingMethod: order.selectedDeliveryMode === 'pickup' ? 'pickup' : order.selectedShippingCode || 'shipping',
          paid: isPaidViaStripe,
          paidAt: order.paidAt,
          paymentProtectionEnabled,
          isPaidViaStripe,
          stripePaymentStatus: order.paymentStatus || null,
          orderId: order.id,
          status: order.orderStatus || 'pending',
          itemReceived: order.buyerConfirmedReceipt || false,
          itemReceivedAt: order.buyerConfirmedAt,
          paymentConfirmed: isPaidViaStripe,
          paymentConfirmedAt: order.paidAt,
          contactDeadline: contactDeadline?.toISOString() || null,
          sellerContactedAt: order.sellerContactedAt?.toISOString() || null,
          buyerContactedAt: order.buyerContactedAt?.toISOString() || null,
          contactWarningSentAt: order.contactWarningSentAt?.toISOString() || null,
          contactDeadlineMissed: contactDeadlineMissed, // Calculated from deadline, not stored on Order
          disputeOpenedAt: order.disputeOpenedAt?.toISOString() || null,
          disputeReason: order.disputeReason || null,
          disputeStatus: order.disputeStatus || null,
          disputeResolvedAt: order.disputeResolvedAt?.toISOString() || null,
          trackingNumber: order.trackingNumber || null,
          trackingProvider: order.trackingProvider || null,
          shippedAt: order.shippedAt?.toISOString() || null,
          estimatedDeliveryDate: null, // Not stored on Order model
          watch: {
            id: watch.id,
            title: watch.title,
            brand: watch.brand,
            model: watch.model,
            images: images,
            price: watch.price,
            finalPrice: order.itemPrice || watch.price,
            purchaseType: 'buy-now' as const,
          },
          buyer: buyerWithAddress,
        }

        return NextResponse.json({ sale: saleFromOrder })
      }
    }

    // Still not found - return debug info
    if (!purchase) {
      const allPurchases = await prisma.purchase.findMany({
        where: {
          watch: { sellerId: session.user.id },
          status: { not: 'cancelled' },
        },
        select: { id: true, watchId: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const allOrders = await prisma.order.findMany({
        where: {
          sellerId: session.user.id,
          orderStatus: { not: 'canceled' },
        },
        select: { id: true, watchId: true, orderStatus: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      console.log(
        `[sales/${searchId}] Not found. Available purchases:`,
        JSON.stringify(allPurchases)
      )
      console.log(
        `[sales/${searchId}] Available orders:`,
        JSON.stringify(allOrders)
      )

      return NextResponse.json(
        {
          message: 'Verkauf nicht gefunden',
          debug: {
            searchedId: searchId,
            sellerId: session.user.id,
            availablePurchases: allPurchases,
            availableOrders: allOrders,
          },
        },
        { status: 404 }
      )
    }

    console.log(
      `[sales/${searchId}] Found purchase ${purchase.id} for watch: ${purchase.watch.title}`
    )

    // Load order if exists
    const order = await prisma.order.findFirst({
      where: {
        watchId: purchase.watchId,
        buyerId: purchase.buyerId,
        sellerId: session.user.id,
      },
      select: {
        id: true,
        paymentStatus: true,
        paidAt: true,
      },
    })

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
    } catch {
      images = []
    }

    const winningBid = watch.bids?.[0]
    const finalPrice = winningBid?.amount || purchase.price || watch.price
    const isBuyNow = watch.buyNowPrice && winningBid && winningBid.amount === watch.buyNowPrice
    const purchaseType = isBuyNow ? 'buy-now' : winningBid ? 'auction' : 'buy-now'

    const paymentProtectionEnabled = watch.paymentProtectionEnabled || false
    const isPaidViaStripe = order?.paymentStatus === 'paid' || order?.paymentStatus === 'released'

    // Fetch buyer address from UserAddress table
    const buyerAddress = purchase.buyer ? await getMainAddress(purchase.buyer.id) : null
    const buyerWithAddress = purchase.buyer
      ? {
          ...purchase.buyer,
          street: buyerAddress?.street || null,
          streetNumber: buyerAddress?.streetNumber || null,
          postalCode: buyerAddress?.postalCode || null,
          city: buyerAddress?.city || null,
        }
      : null

    const sale = {
      id: purchase.id,
      soldAt: purchase.createdAt,
      shippingMethod: purchase.shippingMethod || watch.shippingMethod,
      paid: purchase.paymentConfirmed || purchase.paid || isPaidViaStripe,
      paidAt: purchase.paymentConfirmedAt || purchase.paidAt || order?.paidAt,
      paymentProtectionEnabled,
      isPaidViaStripe,
      stripePaymentStatus: order?.paymentStatus || null,
      orderId: order?.id || null,
      status: purchase.status || 'pending',
      itemReceived: purchase.itemReceived || false,
      itemReceivedAt: purchase.itemReceivedAt,
      paymentConfirmed: purchase.paymentConfirmed || isPaidViaStripe,
      paymentConfirmedAt: purchase.paymentConfirmedAt || order?.paidAt,
      contactDeadline: purchase.contactDeadline?.toISOString() || null,
      sellerContactedAt: purchase.sellerContactedAt?.toISOString() || null,
      buyerContactedAt: purchase.buyerContactedAt?.toISOString() || null,
      contactWarningSentAt: purchase.contactWarningSentAt?.toISOString() || null,
      contactDeadlineMissed: purchase.contactDeadlineMissed || false,
      disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
      disputeReason: purchase.disputeReason || null,
      disputeStatus: purchase.disputeStatus || null,
      disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
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
      buyer: buyerWithAddress,
    }

    return NextResponse.json({ sale })
  } catch (error: any) {
    console.error(`[sales] Error fetching sale:`, error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Verkaufs: ' + error.message },
      { status: 500 }
    )
  }
}
