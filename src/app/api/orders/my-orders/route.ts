import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/orders/my-orders
 * Lädt alle Orders des eingeloggten Users (als Käufer oder Verkäufer)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') // 'buyer' oder 'seller'

    const userId = session.user.id

    // Baue Where-Klausel
    const where: any = {}
    if (role === 'buyer') {
      where.buyerId = userId
    } else if (role === 'seller') {
      where.sellerId = userId
    } else {
      // Beide Rollen
      where.OR = [{ buyerId: userId }, { sellerId: userId }]
    }

    // Lade Orders
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formatiere Orders
    const formattedOrders = orders.map(order => {
      let images: string[] = []
      try {
        if (order.watch.images) {
          images = JSON.parse(order.watch.images)
        }
      } catch (e) {
        console.error('Error parsing images:', e)
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt?.toISOString() || null,
        releasedAt: order.releasedAt?.toISOString() || null,
        refundedAt: order.refundedAt?.toISOString() || null,
        buyerConfirmedReceipt: order.buyerConfirmedReceipt,
        disputeStatus: order.disputeStatus,
        watch: {
          id: order.watch.id,
          title: order.watch.title,
          brand: order.watch.brand,
          model: order.watch.model,
          images,
        },
        buyer: order.buyer,
        seller: order.seller,
        createdAt: order.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Bestellungen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
