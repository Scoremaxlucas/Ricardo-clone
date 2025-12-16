import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/orders/[orderId]/dispute
 * Käufer öffnet einen Dispute für eine Order
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
    const { reason, description } = await request.json()

    if (!reason) {
      return NextResponse.json({ message: 'Grund ist erforderlich' }, { status: 400 })
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { message: 'Beschreibung muss mindestens 10 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Validiere Reason
    const validReasons = [
      'item_not_received',
      'item_not_as_described',
      'damaged_item',
      'wrong_item',
      'seller_not_responding',
      'other',
    ]

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ message: 'Ungültiger Grund' }, { status: 400 })
    }

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
        { message: 'Sie sind nicht berechtigt, einen Dispute für diese Bestellung zu öffnen' },
        { status: 403 }
      )
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending') {
      return NextResponse.json(
        { message: 'Dispute kann nur für bezahlte Bestellungen geöffnet werden' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Dispute existiert
    if (order.disputeStatus !== 'none') {
      return NextResponse.json(
        { message: 'Für diese Bestellung existiert bereits ein Dispute' },
        { status: 400 }
      )
    }


    // Öffne Dispute
    await prisma.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: 'opened',
        disputeOpenedAt: new Date(),
        disputeReason: reason,
        disputeDescription: description.trim(),
        paymentStatus: 'disputed', // Ändere Payment Status zu disputed
      },
    })

    console.log(`[dispute] Dispute geöffnet für Order ${order.orderNumber}`)

    // Benachrichtigungen
    try {
      // Benachrichtigung an Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'DISPUTE_OPENED',
          title: 'Dispute geöffnet',
          message: `Ein Dispute wurde für Bestellung ${order.orderNumber} geöffnet. Bitte kontaktieren Sie den Käufer.`,
          link: `/orders/${order.id}`,
        },
      })

      // Benachrichtigung an Käufer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'DISPUTE_OPENED',
          title: 'Dispute geöffnet',
          message: `Ihr Dispute für Bestellung ${order.orderNumber} wurde eröffnet. Wir werden den Fall prüfen.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[dispute] Fehler beim Erstellen der Notifications:`, error)
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute erfolgreich geöffnet',
    })
  } catch (error: any) {
    console.error('Error opening dispute:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Öffnen des Disputes',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
