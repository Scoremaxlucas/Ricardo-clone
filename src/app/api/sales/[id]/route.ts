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

    const includeOptions = {
      watch: {
        include: {
          bids: {
            orderBy: { amount: 'desc' as const },
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
    }

    // Try to find by purchaseId first
    let purchase = await prisma.purchase.findFirst({
      where: {
        id: searchId,
        watch: {
          sellerId: session.user.id,
        },
      },
      include: includeOptions,
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
        include: includeOptions,
      })
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
      
      console.log(`[sales/${searchId}] Not found. Available purchases:`, JSON.stringify(allPurchases))
      
      return NextResponse.json({ 
        message: 'Verkauf nicht gefunden',
        debug: { 
          searchedId: searchId, 
          sellerId: session.user.id,
          availablePurchases: allPurchases 
        }
      }, { status: 404 })
    }

    console.log(`[sales/${searchId}] Found purchase ${purchase.id} for watch: ${purchase.watch.title}`)

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
      buyer: purchase.buyer,
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
