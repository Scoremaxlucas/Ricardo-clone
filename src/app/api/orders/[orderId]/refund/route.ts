import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/auth-utils'
import { refundOrder } from '@/lib/refund-order'

/**
 * POST /api/orders/[orderId]/refund
 * Admin erstellt einen Refund für eine Order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const orderId = params.orderId
    const { reason } = await request.json().catch(() => ({})) // Reason ist optional

    // Lade Order für Validierung
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecord: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits refunded wurde
    if (order.paymentStatus === 'refunded') {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde bereits zurückerstattet' },
        { status: 400 }
      )
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending' && order.paymentStatus !== 'disputed') {
      return NextResponse.json(
        { message: 'Refund kann nur für bezahlte Bestellungen erstellt werden' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits Transfer erstellt wurde
    if (order.stripeTransferId) {
      return NextResponse.json(
        {
          message:
            'Geld wurde bereits an Verkäufer überwiesen. Refund erfordert manuelle Rückzahlung durch Verkäufer.',
          requiresManualRefund: true,
          transferId: order.stripeTransferId,
        },
        { status: 400 }
      )
    }

    // Erstelle Refund
    const refundId = await refundOrder(orderId, session.user!.id, reason)

    if (!refundId) {
      return NextResponse.json(
        { message: 'Fehler bei der Erstellung des Refunds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Refund erfolgreich erstellt',
      refundId,
    })
  } catch (error: any) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen des Refunds',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders/[orderId]/refund
 * Prüft ob Order refunded werden kann (für Admin UI)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const orderId = params.orderId

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecord: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const canRefund =
      (order.paymentStatus === 'paid' ||
        order.paymentStatus === 'release_pending' ||
        order.paymentStatus === 'disputed') &&
      order.paymentStatus !== 'refunded' &&
      !order.stripeTransferId &&
      !!order.paymentRecord?.stripeChargeId

    return NextResponse.json({
      canRefund,
      reason: canRefund
        ? null
        : order.paymentStatus === 'refunded'
          ? 'Bereits zurückerstattet'
          : order.stripeTransferId
            ? 'Geld bereits an Verkäufer überwiesen'
            : !order.paymentRecord?.stripeChargeId
              ? 'Charge ID nicht gefunden'
              : 'Order nicht bezahlt',
      orderStatus: order.paymentStatus,
      hasTransfer: !!order.stripeTransferId,
      hasCharge: !!order.paymentRecord?.stripeChargeId,
    })
  } catch (error: any) {
    console.error('Error checking refund eligibility:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Prüfen der Refund-Berechtigung',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
