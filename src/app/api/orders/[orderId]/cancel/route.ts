import { authOptions } from '@/lib/auth'
import { cancelInvoiceForOrder } from '@/lib/invoice'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/[orderId]/cancel
 * 
 * Buyer cancellation of an order. Allowed in these scenarios:
 * 
 * 1. Before payment: Order is awaiting_payment and not yet paid
 * 2. After payment, seller not shipping: Payment is 'paid' but seller hasn't shipped
 *    within 14 days (automatic right to cancel)
 * 3. Pickup orders: Buyer can cancel before the pickup takes place
 * 
 * Note: After receipt is confirmed, buyer must use dispute/return flow instead.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { orderId } = await params
    let body: { reason?: string; description?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is ok for simple cancellations
    }

    const reason = body.reason || 'buyer_cancelled'
    const description = body.description || ''

    // Load order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true, nickname: true, email: true } },
        seller: { select: { id: true, name: true, nickname: true, email: true } },
        watch: { select: { id: true, title: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Only buyer can cancel
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Käufer kann die Bestellung stornieren' },
        { status: 403 }
      )
    }

    // Already cancelled or completed
    if (order.orderStatus === 'canceled' || order.orderStatus === 'completed') {
      return NextResponse.json(
        { message: `Bestellung ist bereits ${order.orderStatus === 'canceled' ? 'storniert' : 'abgeschlossen'}` },
        { status: 400 }
      )
    }

    // Cannot cancel if receipt already confirmed
    if (order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Die Bestellung kann nicht mehr storniert werden, da der Erhalt bereits bestätigt wurde. Bitte nutzen Sie die Rückgabe-Funktion.' },
        { status: 400 }
      )
    }

    // Cannot cancel if active dispute
    if (order.disputeStatus !== 'none' && order.disputeStatus !== 'resolved' && order.disputeStatus !== 'closed') {
      return NextResponse.json(
        { message: 'Die Bestellung kann nicht storniert werden, da ein Dispute geöffnet ist.' },
        { status: 400 }
      )
    }

    const now = new Date()

    // === SCENARIO 1: Before payment (awaiting_payment or created) ===
    if (order.paymentStatus === 'created' || order.paymentStatus === 'awaiting_payment') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'canceled',
          paymentStatus: 'refunded', // Nothing to refund, but mark as resolved
          autoCancelledAt: now,
          autoCancelReason: `Käufer-Stornierung: ${reason}`,
        },
      })

      try {
        const cancelledInvoice = await cancelInvoiceForOrder(
          orderId,
          `Käufer-Stornierung vor Zahlung (${reason})`
        )
        if (cancelledInvoice) {
          console.log(
            `[cancel-order] ✅ Rechnung ${cancelledInvoice.invoiceNumber} für Order ${orderId} storniert`
          )
        }
      } catch (invoiceError) {
        console.error('[cancel-order] Fehler beim Stornieren der Rechnung:', invoiceError)
      }

      // Notify seller
      await createCancellationNotifications(order, 'Käufer hat vor Zahlung storniert', reason, description)

      return NextResponse.json({
        success: true,
        message: 'Bestellung erfolgreich storniert.',
        scenario: 'before_payment',
      })
    }

    // === SCENARIO 2: After payment, seller hasn't shipped (14-day rule) ===
    if (
      (order.paymentStatus === 'paid' || order.paymentStatus === 'release_pending') &&
      !order.shippedAt
    ) {
      // Check if 14 days have passed since payment
      const paidDate = order.paidAt ? new Date(order.paidAt) : null
      const daysSincePaid = paidDate
        ? Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // For paid orders where seller hasn't shipped, allow cancellation if:
      // - 14 days have passed since payment, OR
      // - The order is a pickup order (can always cancel before pickup)
      const isPickup = order.selectedDeliveryMode === 'pickup' || order.paymentMethod === 'cash_on_pickup'

      if (!isPickup && daysSincePaid < 14) {
        return NextResponse.json(
          {
            message: `Die Bestellung kann erst 14 Tage nach Zahlung storniert werden, wenn der Verkäufer nicht versendet hat. Bitte warten Sie noch ${14 - daysSincePaid} Tag(e) oder öffnen Sie einen Dispute.`,
            daysRemaining: 14 - daysSincePaid,
            canDispute: true,
          },
          { status: 400 }
        )
      }

      // Process cancellation with refund flag
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'canceled',
          paymentStatus: 'refunded',
          refundedAt: now,
          autoCancelledAt: now,
          autoCancelReason: isPickup
            ? `Käufer-Stornierung (Abholung): ${reason}`
            : `Käufer-Stornierung (Verkäufer hat nicht versendet): ${reason}`,
        },
      })

      try {
        const cancelledInvoice = await cancelInvoiceForOrder(
          orderId,
          isPickup
            ? `Käufer-Stornierung Abholung (${reason})`
            : `Käufer-Stornierung nach Zahlung, nicht versendet (${reason})`
        )
        if (cancelledInvoice) {
          console.log(
            `[cancel-order] ✅ Rechnung ${cancelledInvoice.invoiceNumber} für Order ${orderId} storniert`
          )
        }
      } catch (invoiceError) {
        console.error('[cancel-order] Fehler beim Stornieren der Rechnung:', invoiceError)
      }

      // Notify both parties
      const message = isPickup
        ? 'Käufer hat die Abholung storniert'
        : 'Käufer hat storniert (Versand nicht innerhalb 14 Tagen)'
      await createCancellationNotifications(order, message, reason, description)

      return NextResponse.json({
        success: true,
        message: isPickup
          ? 'Bestellung erfolgreich storniert.'
          : 'Bestellung storniert. Eine Rückerstattung wird veranlasst.',
        scenario: isPickup ? 'pickup_cancelled' : 'seller_not_shipped',
        refundInitiated: !isPickup,
      })
    }

    // === SCENARIO 3: Pickup orders that haven't been completed ===
    const isPickup = order.selectedDeliveryMode === 'pickup' || order.paymentMethod === 'cash_on_pickup'
    if (isPickup && order.orderStatus !== 'completed') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'canceled',
          autoCancelledAt: now,
          autoCancelReason: `Käufer-Stornierung (Abholung): ${reason}`,
        },
      })

      try {
        const cancelledInvoice = await cancelInvoiceForOrder(
          orderId,
          `Käufer-Stornierung Abholung (${reason})`
        )
        if (cancelledInvoice) {
          console.log(
            `[cancel-order] ✅ Rechnung ${cancelledInvoice.invoiceNumber} für Order ${orderId} storniert`
          )
        }
      } catch (invoiceError) {
        console.error('[cancel-order] Fehler beim Stornieren der Rechnung:', invoiceError)
      }

      await createCancellationNotifications(order, 'Käufer hat die Abholung storniert', reason, description)

      return NextResponse.json({
        success: true,
        message: 'Bestellung erfolgreich storniert.',
        scenario: 'pickup_cancelled',
      })
    }

    // If none of the above scenarios apply (e.g., already shipped)
    return NextResponse.json(
      {
        message: 'Die Bestellung kann in diesem Status nicht storniert werden. Wenn Sie ein Problem haben, öffnen Sie bitte einen Dispute.',
        canDispute: order.paymentStatus === 'paid' && order.disputeStatus === 'none',
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[cancel-order] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Stornieren der Bestellung', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Create notifications for both buyer and seller when an order is cancelled
 */
async function createCancellationNotifications(
  order: {
    id: string
    orderNumber: string
    buyerId: string
    sellerId: string
    watch: { id: string; title: string }
    seller: { name: string | null; nickname: string | null }
  },
  statusMessage: string,
  reason: string,
  description: string
) {
  try {
    const reasonLabels: Record<string, string> = {
      buyer_cancelled: 'Storniert durch Käufer',
      changed_mind: 'Meinung geändert',
      found_elsewhere: 'Anderswo gefunden',
      price_too_high: 'Preis zu hoch',
      seller_not_shipping: 'Verkäufer hat nicht versendet',
      seller_not_responding: 'Verkäufer antwortet nicht',
      other: 'Sonstiges',
    }

    const reasonLabel = reasonLabels[reason] || reason

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'ORDER_CANCELLED',
        title: 'Bestellung storniert',
        message: `Die Bestellung ${order.orderNumber} für "${order.watch.title}" wurde storniert. Grund: ${reasonLabel}${description ? ` — ${description}` : ''}`,
        link: `/orders/${order.id}`,
        watchId: order.watch.id,
      },
    })

    // Notify buyer (confirmation)
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ORDER_CANCELLED',
        title: 'Stornierung bestätigt',
        message: `Ihre Stornierung der Bestellung ${order.orderNumber} wurde bestätigt.`,
        link: `/orders/${order.id}`,
        watchId: order.watch.id,
      },
    })

    // Send email to seller
    try {
      const { sendEmail } = await import('@/lib/email')
      const sellerName = order.seller.nickname || order.seller.name || 'Verkäufer'
      await sendEmail({
        to: (order.seller as any).email,
        subject: `Bestellung ${order.orderNumber} storniert`,
        html: `
          <h2>Bestellung storniert</h2>
          <p>Hallo ${sellerName},</p>
          <p>Die Bestellung <strong>${order.orderNumber}</strong> für "<strong>${order.watch.title}</strong>" wurde vom Käufer storniert.</p>
          <p><strong>Grund:</strong> ${reasonLabel}</p>
          ${description ? `<p><strong>Bemerkung:</strong> ${description}</p>` : ''}
          <p>Der Artikel ist wieder verfügbar und kann erneut verkauft werden.</p>
          <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
        `,
        text: `Bestellung ${order.orderNumber} wurde storniert. Grund: ${reasonLabel}`,
      })
    } catch (emailError) {
      console.error('[cancel-order] Email error:', emailError)
    }
  } catch (error) {
    console.error('[cancel-order] Notification error:', error)
  }
}
