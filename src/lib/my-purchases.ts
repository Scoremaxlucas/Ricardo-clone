import { prisma } from '@/lib/prisma'

export interface MyPurchaseItem {
  id: string
  purchasedAt: string
  shippingMethod: string | null
  paid: boolean
  status: string
  itemReceived: boolean
  itemReceivedAt: string | null
  paymentConfirmed: boolean
  paymentConfirmedAt: string | null
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactWarningSentAt: string | null
  contactDeadlineMissed: boolean
  paymentDeadline: string | null
  paymentReminderSentAt: string | null
  paymentDeadlineMissed: boolean
  disputeOpenedAt: string | null
  disputeReason: string | null
  disputeStatus: string | null
  disputeResolvedAt: string | null
  trackingNumber?: string | null
  trackingProvider?: string | null
  shippedAt?: string | null
  // Price breakdown fields
  itemPrice?: number
  shippingCost?: number
  platformFee?: number
  protectionFee?: number
  totalAmount?: number
  // Payment method tracking
  hasStripePayment?: boolean // true if paid via Stripe (protected), false if bank transfer (unprotected)
  paymentProtectionEnabled?: boolean // from watch
  orderId?: string | null // Order ID if exists (for Stripe checkout)
  orderNumber?: string // Order number for display
  paymentMethod?: string | null // 'stripe' | 'bank_transfer' | 'cash_on_pickup'
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    seller: {
      id: string
      name: string | null
      email: string | null
      phone: string | null
      firstName: string | null
      lastName: string | null
      paymentMethods: string | null
      stripeConnectedAccountId: string | null
      stripeOnboardingComplete: boolean
    } | null
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
}

/**
 * Fetch user's purchases server-side for instant rendering
 * UNIFIED: Fetches both old purchases AND new orders
 */
export async function getMyPurchases(userId: string): Promise<MyPurchaseItem[]> {
  try {
    // Query 1: Old purchases system
    const purchases = await prisma.purchase.findMany({
      where: {
        buyerId: userId,
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        price: true,
        createdAt: true,
        shippingMethod: true,
        paymentConfirmed: true,
        paid: true,
        status: true,
        itemReceived: true,
        itemReceivedAt: true,
        paymentConfirmedAt: true,
        contactDeadline: true,
        sellerContactedAt: true,
        buyerContactedAt: true,
        contactWarningSentAt: true,
        contactDeadlineMissed: true,
        paymentDeadline: true,
        paymentReminderSentAt: true,
        paymentDeadlineMissed: true,
        disputeOpenedAt: true,
        disputeReason: true,
        disputeStatus: true,
        disputeResolvedAt: true,
        trackingNumber: true,
        trackingProvider: true,
        shippedAt: true,
        watchId: true,
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
            isAuction: true,
            paymentProtectionEnabled: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                paymentMethods: true,
                stripeConnectedAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Query 2: New orders system (for items bought via checkout)
    const orders = await prisma.order.findMany({
      where: {
        buyerId: userId,
        orderStatus: { not: 'canceled' },
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        orderStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        itemPrice: true,
        shippingCost: true,
        platformFee: true,
        protectionFee: true,
        totalAmount: true,
        paidAt: true,
        shippedAt: true,
        deliveredAt: true,
        trackingNumber: true,
        trackingProvider: true,
        buyerConfirmedReceipt: true,
        buyerConfirmedAt: true,
        disputeStatus: true,
        disputeOpenedAt: true,
        disputeReason: true,
        disputeResolvedAt: true,
        contactDeadline: true,
        sellerContactedAt: true,
        buyerContactedAt: true,
        contactWarningSentAt: true,
        paymentDeadline: true,
        paymentReminderSentAt: true,
        paymentDeadlineMissed: true,
        stripePaymentIntentId: true,
        stripeChargeId: true,
        selectedDeliveryMode: true,
        watchId: true,
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
            isAuction: true,
            paymentProtectionEnabled: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                paymentMethods: true,
                stripeConnectedAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Collect watchIds that have orders (to avoid duplicates)
    const orderWatchIds = new Set(orders.map(o => o.watchId))

    // Helper function to parse images
    const parseImages = (images: any): string[] => {
      if (!images) return []
      try {
        if (typeof images === 'string') {
          if (images.startsWith('[') || images.startsWith('{')) {
            return JSON.parse(images)
          } else {
            return images.split(',').filter((img: string) => img.trim().length > 0)
          }
        } else if (Array.isArray(images)) {
          return images
        }
      } catch {
        return []
      }
      return []
    }

    // Map old purchases (but skip if there's an order for the same watch)
    const purchaseItems = purchases
      .filter(p => !orderWatchIds.has(p.watchId)) // Skip if order exists for same watch
      .map(purchase => {
        const watch = purchase.watch
        const images = parseImages(watch.images)
        const finalPrice = purchase.price || watch.price || 0
        const purchaseType = watch.isAuction && finalPrice !== watch.buyNowPrice ? 'auction' : 'buy-now'

        return {
          id: purchase.id,
          purchasedAt: purchase.createdAt.toISOString(),
          shippingMethod: purchase.shippingMethod || watch.shippingMethod || null,
          paid: purchase.paymentConfirmed || purchase.paid || false,
          status: purchase.status || 'pending',
          itemReceived: purchase.itemReceived || false,
          itemReceivedAt: purchase.itemReceivedAt?.toISOString() || null,
          paymentConfirmed: purchase.paymentConfirmed || false,
          paymentConfirmedAt: purchase.paymentConfirmedAt?.toISOString() || null,
          contactDeadline: purchase.contactDeadline?.toISOString() || null,
          sellerContactedAt: purchase.sellerContactedAt?.toISOString() || null,
          buyerContactedAt: purchase.buyerContactedAt?.toISOString() || null,
          contactWarningSentAt: purchase.contactWarningSentAt?.toISOString() || null,
          contactDeadlineMissed: purchase.contactDeadlineMissed || false,
          paymentDeadline: purchase.paymentDeadline?.toISOString() || null,
          paymentReminderSentAt: purchase.paymentReminderSentAt?.toISOString() || null,
          paymentDeadlineMissed: purchase.paymentDeadlineMissed || false,
          disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
          disputeReason: purchase.disputeReason || null,
          disputeStatus: purchase.disputeStatus || null,
          disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
          trackingNumber: purchase.trackingNumber || null,
          trackingProvider: purchase.trackingProvider || null,
          shippedAt: purchase.shippedAt?.toISOString() || null,
          hasStripePayment: false,
          paymentProtectionEnabled: watch.paymentProtectionEnabled || false,
          orderId: null,
          watch: {
            id: watch.id,
            title: watch.title || 'Unbekanntes Produkt',
            brand: watch.brand || '',
            model: watch.model || '',
            images: images || [],
            seller: watch.seller ? {
              ...watch.seller,
              stripeConnectedAccountId: watch.seller.stripeConnectedAccountId || null,
              stripeOnboardingComplete: watch.seller.stripeOnboardingComplete || false,
            } : null,
            price: watch.price || 0,
            finalPrice,
            purchaseType,
          },
        }
      })

    // Map new orders to the same format
    const orderItems = orders.map(order => {
      const watch = order.watch
      const images = parseImages(watch.images)
      const finalPrice = order.itemPrice || watch.price || 0
      const hasStripePayment = !!(order.stripePaymentIntentId || order.stripeChargeId)
      const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'released' || order.paymentStatus === 'release_pending'

      // Map order status to purchase-like status
      let status = 'pending'
      if (order.orderStatus === 'completed') status = 'completed'
      else if (order.orderStatus === 'shipped') status = 'shipped'
      else if (order.orderStatus === 'paid') status = 'paid'
      else if (order.orderStatus === 'awaiting_payment') status = 'pending'
      else if (order.orderStatus === 'confirmed') status = 'confirmed'

      return {
        id: order.id,
        purchasedAt: order.createdAt.toISOString(),
        shippingMethod: order.selectedDeliveryMode || watch.shippingMethod || null,
        paid: isPaid,
        status,
        itemReceived: order.buyerConfirmedReceipt || false,
        itemReceivedAt: order.buyerConfirmedAt?.toISOString() || null,
        paymentConfirmed: isPaid,
        paymentConfirmedAt: order.paidAt?.toISOString() || null,
        contactDeadline: order.contactDeadline?.toISOString() || null,
        sellerContactedAt: order.sellerContactedAt?.toISOString() || null,
        buyerContactedAt: order.buyerContactedAt?.toISOString() || null,
        contactWarningSentAt: order.contactWarningSentAt?.toISOString() || null,
        contactDeadlineMissed: false,
        paymentDeadline: order.paymentDeadline?.toISOString() || null,
        paymentReminderSentAt: order.paymentReminderSentAt?.toISOString() || null,
        paymentDeadlineMissed: order.paymentDeadlineMissed || false,
        disputeOpenedAt: order.disputeOpenedAt?.toISOString() || null,
        disputeReason: order.disputeReason || null,
        disputeStatus: order.disputeStatus || null,
        disputeResolvedAt: order.disputeResolvedAt?.toISOString() || null,
        trackingNumber: order.trackingNumber || null,
        trackingProvider: order.trackingProvider || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        // Price breakdown from Order
        itemPrice: order.itemPrice || undefined,
        shippingCost: order.shippingCost || undefined,
        platformFee: order.platformFee || undefined,
        protectionFee: order.protectionFee || undefined,
        totalAmount: order.totalAmount || undefined,
        // Payment method tracking
        hasStripePayment,
        paymentProtectionEnabled: watch.paymentProtectionEnabled || false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        watch: {
          id: watch.id,
          title: watch.title || 'Unbekanntes Produkt',
          brand: watch.brand || '',
          model: watch.model || '',
          images: images || [],
          seller: watch.seller ? {
            ...watch.seller,
            stripeConnectedAccountId: watch.seller.stripeConnectedAccountId || null,
            stripeOnboardingComplete: watch.seller.stripeOnboardingComplete || false,
          } : null,
          price: watch.price || 0,
          finalPrice,
          purchaseType: 'buy-now' as const,
        },
      }
    })

    // Merge and sort by date (newest first)
    const allItems = [...orderItems, ...purchaseItems]
    allItems.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())

    return allItems
  } catch (error) {
    console.error('Error fetching my purchases:', error)
    return []
  }
}
