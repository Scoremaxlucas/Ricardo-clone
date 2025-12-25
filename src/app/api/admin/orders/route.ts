import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    })
  }

  return user?.isAdmin === true
}

/**
 * GET /api/admin/orders
 * Lädt alle Orders mit detaillierten Payment-Informationen für Admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'all', 'paid', 'released', 'pending_onboarding'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Baue Where-Klausel
    const where: any = {}
    if (status && status !== 'all') {
      where.paymentStatus = status
    }

    // Lade Orders mit allen relevanten Details
    const orders = await prisma.order.findMany({
      where,
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            images: true,
            paymentProtectionEnabled: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
            connectOnboardingStatus: true,
            payoutsEnabled: true,
          },
        },
        paymentRecord: {
          select: {
            id: true,
            stripePaymentIntentId: true,
            stripeChargeId: true,
            stripeTransferId: true,
            transferStatus: true,
            refundStatus: true,
            amount: true,
            sellerAmount: true,
            platformFee: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Formatiere Orders mit Diagnose-Informationen
    const formattedOrders = orders.map(order => {
      let images: string[] = []
      try {
        if (order.watch.images) {
          if (typeof order.watch.images === 'string') {
            images = JSON.parse(order.watch.images)
          } else if (Array.isArray(order.watch.images)) {
            images = order.watch.images
          }
        }
      } catch (e) {
        console.error('Error parsing images:', e)
      }

      // Diagnose: Warum wurde Transfer noch nicht erstellt?
      const diagnosis: string[] = []
      if (order.paymentStatus === 'paid' && !order.stripeTransferId) {
        if (!order.buyerConfirmedReceipt) {
          diagnosis.push('Käufer hat Erhalt noch nicht bestätigt')
        }
        if (!order.seller.stripeConnectedAccountId) {
          diagnosis.push('Verkäufer hat kein Stripe-Konto')
        }
        // Prüfe Onboarding-Status konsistent mit my-sales/route.ts
        const isOnboardingComplete =
          order.seller.connectOnboardingStatus === 'COMPLETE' ||
          order.seller.payoutsEnabled === true ||
          order.seller.stripeOnboardingComplete === true
        if (order.seller.stripeConnectedAccountId && !isOnboardingComplete) {
          diagnosis.push('Verkäufer-Onboarding nicht abgeschlossen')
        }
        if (!order.paymentRecord?.stripeChargeId) {
          diagnosis.push('Keine Charge-ID vorhanden')
        }
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        itemPrice: order.itemPrice,
        shippingCost: order.shippingCost,
        platformFee: order.platformFee,
        protectionFee: order.protectionFee,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        stripeTransferId: order.stripeTransferId,
        buyerConfirmedReceipt: order.buyerConfirmedReceipt,
        buyerConfirmedAt: order.buyerConfirmedAt?.toISOString() || null,
        disputeStatus: order.disputeStatus,
        disputeReason: order.disputeReason,
        autoReleaseAt: order.autoReleaseAt?.toISOString() || null,
        paidAt: order.paidAt?.toISOString() || null,
        releasedAt: order.releasedAt?.toISOString() || null,
        refundedAt: order.refundedAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        watch: {
          id: order.watch.id,
          title: order.watch.title,
          brand: order.watch.brand,
          model: order.watch.model,
          images,
          paymentProtectionEnabled: order.watch.paymentProtectionEnabled,
        },
        buyer: {
          id: order.buyer.id,
          name: order.buyer.name,
          email: order.buyer.email,
          firstName: order.buyer.firstName,
          lastName: order.buyer.lastName,
        },
        seller: {
          id: order.seller.id,
          name: order.seller.name,
          email: order.seller.email,
          firstName: order.seller.firstName,
          lastName: order.seller.lastName,
          stripeConnectedAccountId: order.seller.stripeConnectedAccountId,
          stripeOnboardingComplete: order.seller.stripeOnboardingComplete,
          connectOnboardingStatus: order.seller.connectOnboardingStatus,
          payoutsEnabled: order.seller.payoutsEnabled,
        },
        paymentRecord: order.paymentRecord,
        diagnosis,
      }
    })

    // Zusammenfassung
    const summary = {
      total: orders.length,
      paid: orders.filter(o => o.paymentStatus === 'paid').length,
      released: orders.filter(o => o.paymentStatus === 'released').length,
      pendingOnboarding: orders.filter(o => o.paymentStatus === 'release_pending_onboarding').length,
      refunded: orders.filter(o => o.paymentStatus === 'refunded').length,
      awaitingPayment: orders.filter(o => o.paymentStatus === 'created').length,
    }

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      summary,
    })
  } catch (error: any) {
    console.error('[admin/orders] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Bestellungen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
