import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/auth-utils'
import { releaseFunds } from '@/lib/release-funds'
import { stripe } from '@/lib/stripe-server'

/**
 * POST /api/orders/[orderId]/resolve-dispute
 * Admin löst einen Dispute auf (refund oder release)
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
    const { resolution, adminNotes } = await request.json()

    // Validiere Resolution
    const validResolutions = ['refund', 'release']

    if (!resolution || !validResolutions.includes(resolution)) {
      return NextResponse.json(
        { message: 'Ungültige Resolution. Muss "refund" oder "release" sein.' },
        { status: 400 }
      )
    }

    // Lade Order mit PaymentRecord
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecord: true,
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob ein Dispute existiert
    if (order.disputeStatus !== 'opened' && order.disputeStatus !== 'under_review') {
      return NextResponse.json(
        { message: 'Für diese Bestellung existiert kein aktiver Dispute' },
        { status: 400 }
      )
    }

    // Prüfe ob Order bereits gelöst wurde
    if (order.disputeStatus === 'resolved_refund' || order.disputeStatus === 'resolved_release') {
      return NextResponse.json(
        { message: 'Dieser Dispute wurde bereits gelöst' },
        { status: 400 }
      )
    }

    const adminId = session.user!.id

    if (resolution === 'refund') {
      // Refund: Geld zurück an Käufer
      if (!order.paymentRecord?.stripeChargeId) {
        return NextResponse.json(
          { message: 'Charge ID nicht gefunden. Refund nicht möglich.' },
          { status: 400 }
        )
      }

      // Prüfe ob bereits Transfer erstellt wurde
      if (order.stripeTransferId) {
        // Transfer wurde bereits erstellt - kann nicht mehr refunded werden
        // In diesem Fall müsste der Verkäufer manuell zurückzahlen
        return NextResponse.json(
          {
            message:
              'Geld wurde bereits an Verkäufer überwiesen. Refund erfordert manuelle Rückzahlung durch Verkäufer.',
            requiresManualRefund: true,
          },
          { status: 400 }
        )
      }

      // Erstelle Refund über Stripe
      const refund = await stripe.refunds.create({
        charge: order.paymentRecord.stripeChargeId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: 'dispute_resolution',
          resolvedBy: adminId,
        },
      })

      console.log(`[dispute] Refund ${refund.id} erstellt für Order ${order.orderNumber}`)

      // Update Order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          disputeStatus: 'resolved_refund',
          disputeResolvedAt: new Date(),
          disputeResolvedBy: adminId,
          paymentStatus: 'refunded',
          orderStatus: 'canceled',
          refundedAt: new Date(),
          stripeRefundId: refund.id,
        },
      })

      // Update PaymentRecord
      if (order.paymentRecord) {
        await prisma.paymentRecord.update({
          where: { id: order.paymentRecord.id },
          data: {
            stripeRefundId: refund.id,
            refundStatus: refund.status,
          },
        })
      }

      // Benachrichtigungen
      try {
        await prisma.notification.create({
          data: {
            userId: order.buyerId,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute gelöst - Rückerstattung',
            message: `Ihr Dispute für Bestellung ${order.orderNumber} wurde gelöst. Das Geld wurde zurückerstattet.`,
            link: `/orders/${order.id}`,
          },
        })

        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute gelöst - Rückerstattung',
            message: `Der Dispute für Bestellung ${order.orderNumber} wurde gelöst. Das Geld wurde an den Käufer zurückerstattet.`,
            link: `/orders/${order.id}`,
          },
        })
      } catch (error: any) {
        console.error(`[dispute] Fehler beim Erstellen der Notifications:`, error)
      }

      return NextResponse.json({
        success: true,
        message: 'Dispute gelöst - Geld zurückerstattet',
        refundId: refund.id,
      })
    } else if (resolution === 'release') {
      // Release: Geld an Verkäufer freigeben
      if (order.paymentStatus === 'released') {
        return NextResponse.json(
          { message: 'Geld wurde bereits freigegeben' },
          { status: 400 }
        )
      }

      // Gib Gelder frei
      const transferId = await releaseFunds(orderId)

      if (!transferId) {
        return NextResponse.json(
          { message: 'Fehler bei der Freigabe der Zahlung' },
          { status: 500 }
        )
      }

      // Update Order Dispute Status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          disputeStatus: 'resolved_release',
          disputeResolvedAt: new Date(),
          disputeResolvedBy: adminId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Dispute gelöst - Geld freigegeben',
        transferId,
      })
    }
  } catch (error: any) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Lösen des Disputes',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
