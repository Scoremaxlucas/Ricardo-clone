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
      street: string | null
      streetNumber: string | null
      postalCode: string | null
      city: string | null
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
 * ULTRA-OPTIMIZED: No N+1 problem - purchase.price is already the final price
 */
export async function getMyPurchases(userId: string): Promise<MyPurchaseItem[]> {
  try {
    // ULTRA-MINIMALE Query: purchase.price ist bereits der finale Preis (winning bid oder buyNowPrice)
    // KEINE bids Query nötig - das würde N+1 Problem verursachen
    const purchases = await prisma.purchase.findMany({
      where: {
        buyerId: userId,
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        price: true, // purchase.price ist bereits der finale Preis
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
            orders: {
              where: {
                buyerId: userId,
              },
              select: {
                id: true,
                stripePaymentIntentId: true,
                stripeChargeId: true,
                paymentStatus: true,
                itemPrice: true,
                shippingCost: true,
                platformFee: true,
                protectionFee: true,
                totalAmount: true,
              },
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                street: true,
                streetNumber: true,
                postalCode: true,
                city: true,
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

    return purchases.map(purchase => {
      const watch = purchase.watch

      // Parse images
      let images: string[] = []
      if (watch.images) {
        try {
          if (typeof watch.images === 'string') {
            if (watch.images.startsWith('[') || watch.images.startsWith('{')) {
              images = JSON.parse(watch.images)
            } else {
              images = watch.images.split(',').filter(img => img.trim().length > 0)
            }
          } else if (Array.isArray(watch.images)) {
            images = watch.images
          }
        } catch {
          images = []
        }
      }

      // Check if there's a Stripe payment (protected) or bank transfer (unprotected)
      const order = watch.orders?.[0]
      const hasStripePayment = !!(order?.stripePaymentIntentId || order?.stripeChargeId)
      const paymentProtectionEnabled = watch.paymentProtectionEnabled || false

      // IMPORTANT: Derive payment status from Order if Stripe payment exists
      // This ensures the UI reflects Stripe payment status correctly
      const isPaidViaStripe = order?.paymentStatus === 'paid' || order?.paymentStatus === 'released'
      const effectivePaid = purchase.paymentConfirmed || purchase.paid || isPaidViaStripe

      // purchase.price ist bereits der finale Preis (winning bid oder buyNowPrice)
      const finalPrice = purchase.price || watch.price || 0
      // Bestimme purchaseType basierend auf isAuction und buyNowPrice
      const purchaseType =
        watch.isAuction && finalPrice !== watch.buyNowPrice ? 'auction' : 'buy-now'

      return {
        id: purchase.id,
        purchasedAt: purchase.createdAt.toISOString(),
        shippingMethod: purchase.shippingMethod || watch.shippingMethod || null,
        paid: effectivePaid,
        status: purchase.status || 'pending',
        itemReceived: purchase.itemReceived || false,
        itemReceivedAt: purchase.itemReceivedAt?.toISOString() || null,
        paymentConfirmed: purchase.paymentConfirmed || isPaidViaStripe,
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
        // Price breakdown from Order if available
        itemPrice: order?.itemPrice || undefined,
        shippingCost: order?.shippingCost || undefined,
        platformFee: order?.platformFee || undefined,
        protectionFee: order?.protectionFee || undefined,
        totalAmount: order?.totalAmount || undefined,
        // Payment method tracking
        hasStripePayment,
        paymentProtectionEnabled,
        orderId: order?.id || null,
        watch: {
          id: watch.id,
          title: watch.title || 'Unbekanntes Produkt',
          brand: watch.brand || '',
          model: watch.model || '',
          images: images || [],
          seller: watch.seller
            ? {
                ...watch.seller,
                stripeConnectedAccountId: watch.seller.stripeConnectedAccountId || null,
                stripeOnboardingComplete: watch.seller.stripeOnboardingComplete || false,
              }
            : null,
          price: watch.price || 0,
          finalPrice,
          purchaseType,
        },
      }
    })
  } catch (error) {
    console.error('Error fetching my purchases:', error)
    // Return empty array on error to prevent Server Component crash
    return []
  }
}
