import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseFunds } from '@/lib/release-funds'

/**
 * POST /api/orders/[orderId]/confirm-receipt
 * Käufer bestätigt Erhalt der Ware und gibt Zahlung frei
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const orderId = params.orderId

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Käufer ist
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Bestellung zu bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob Order bereits bestätigt wurde
    if (order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde bereits bestätigt' },
        { status: 400 }
      )
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending') {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde noch nicht bezahlt' },
        { status: 400 }
      )
    }

    // Prüfe ob Order bereits freigegeben wurde
    if (order.paymentStatus === 'released') {
      return NextResponse.json(
        { message: 'Die Zahlung wurde bereits freigegeben' },
        { status: 400 }
      )
    }

    // Update Order - Käufer bestätigt Erhalt
    await prisma.order.update({
      where: { id: orderId },
      data: {
        buyerConfirmedReceipt: true,
        buyerConfirmedAt: new Date(),
        paymentStatus: 'release_pending',
        orderStatus: 'processing',
      },
    })

    // Gib Gelder frei
    const transferId = await releaseFunds(orderId)

    if (!transferId) {
      return NextResponse.json(
        { message: 'Fehler bei der Freigabe der Zahlung' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Zahlung erfolgreich freigegeben',
      transferId,
    })
  } catch (error: any) {
    console.error('Error confirming receipt:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Bestätigen des Erhalts',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
