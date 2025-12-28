import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/orders/[orderId]
 * Holt Order-Details für den Käufer oder Verkäufer
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Handle both Promise and direct params (for compatibility)
    let orderId: string
    try {
      const resolvedParams = 'then' in context.params 
        ? await context.params 
        : context.params
      orderId = resolvedParams.orderId
    } catch (paramError) {
      console.error('[orders/[orderId]] Error resolving params:', paramError)
      return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ message: 'Order-ID fehlt' }, { status: 400 })
    }

    console.log(`[orders/[orderId]] Fetching order: ${orderId} for user: ${session.user.id}`)

    // Lade Order mit allen Details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            images: true,
            price: true,
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
          },
        },
        paymentRecord: {
          select: {
            paymentStatus: true,
            transferStatus: true,
            refundStatus: true,
          },
        },
      },
    })

    if (!order) {
      console.log(`[orders/[orderId]] Order not found: ${orderId}`)
      
      // Try to find the order by checking all orders for this user
      const userOrders = await prisma.order.findMany({
        where: {
          OR: [
            { buyerId: session.user.id },
            { sellerId: session.user.id },
          ],
        },
        select: { id: true, orderNumber: true },
        take: 5,
      })
      console.log(`[orders/[orderId]] User's recent orders:`, userOrders.map(o => o.id))
      
      return NextResponse.json({ 
        message: 'Bestellung nicht gefunden',
        requestedId: orderId,
        hint: 'Die Order-ID existiert nicht in der Datenbank. Möglicherweise wurde die Bestellung nicht erstellt oder gelöscht.'
      }, { status: 404 })
    }

    // Prüfe ob User Käufer oder Verkäufer ist
    const isOwner = order.buyerId === session.user.id || order.sellerId === session.user.id

    // Admins können auch alle Orders sehen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
    const isAdmin = user?.isAdmin === true

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Bestellung anzusehen' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        itemPrice: order.itemPrice,
        shippingCost: order.shippingCost,
        platformFee: order.platformFee,
        protectionFee: order.protectionFee,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        buyerConfirmedReceipt: order.buyerConfirmedReceipt,
        buyerConfirmedAt: order.buyerConfirmedAt,
        disputeStatus: order.disputeStatus,
        disputeReason: order.disputeReason,
        disputeDescription: order.disputeDescription,
        trackingNumber: order.trackingNumber,
        trackingProvider: order.trackingProvider,
        paidAt: order.paidAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        releasedAt: order.releasedAt,
        refundedAt: order.refundedAt,
        autoReleaseAt: order.autoReleaseAt,
        createdAt: order.createdAt,
        watch: order.watch,
        buyer: order.buyer,
        seller: order.seller,
        paymentRecord: order.paymentRecord,
        // Indicate role for UI
        isBuyer: order.buyerId === session.user.id,
        isSeller: order.sellerId === session.user.id,
      },
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Bestellung',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
