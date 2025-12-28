import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/orders/[orderId]
 * Holt Order-Details für den Käufer oder Verkäufer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    let orderId: string
    try {
      const resolvedParams = await params
      orderId = resolvedParams.orderId
    } catch (paramError) {
      console.error('Error resolving params:', paramError)
      return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ message: 'Order-ID fehlt' }, { status: 400 })
    }

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
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
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
