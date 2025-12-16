import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { isRefundCreated } from './webhook-idempotency'

/**
 * Erstattet eine Order zurück (Admin-Funktion)
 * @param orderId - Die Order ID
 * @param adminId - Die Admin User ID
 * @param reason - Grund für Refund (optional)
 * @returns Refund ID oder null bei Fehler
 */
export async function refundOrder(
  orderId: string,
  adminId: string,
  reason?: string
): Promise<string | null> {
  try {
    console.log(`[refund-order] Starte Refund für Order ${orderId}`)

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
      throw new Error(`Order ${orderId} nicht gefunden`)
    }

    // Idempotency Check: Prüfe ob Refund bereits erstellt wurde
    if (await isRefundCreated(orderId)) {
      console.log(`[refund-order] Order ${orderId} wurde bereits refunded (Idempotency Check)`)
      return order.stripeRefundId || null
    }

    // Prüfe ob Order bereits refunded wurde (zusätzliche Sicherheit)
    if (order.paymentStatus === 'refunded') {
      console.log(`[refund-order] Order ${orderId} wurde bereits refunded`)
      return order.stripeRefundId || null
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending' && order.paymentStatus !== 'disputed') {
      throw new Error(`Order ${orderId} ist nicht bezahlt (Status: ${order.paymentStatus})`)
    }

    // Prüfe ob PaymentRecord existiert
    if (!order.paymentRecord) {
      throw new Error(`PaymentRecord für Order ${orderId} nicht gefunden`)
    }

    // Prüfe ob Charge existiert
    if (!order.paymentRecord.stripeChargeId) {
      throw new Error(`Charge für Order ${orderId} nicht gefunden`)
    }

    // Prüfe ob bereits Transfer erstellt wurde
    if (order.stripeTransferId) {
      // Transfer wurde bereits erstellt - kann nicht mehr direkt refunded werden
      // In diesem Fall müsste der Verkäufer manuell zurückzahlen
      throw new Error(
        'Geld wurde bereits an Verkäufer überwiesen. Refund erfordert manuelle Rückzahlung durch Verkäufer.'
      )
    }

    // Erstelle Refund über Stripe
    const refund = await stripe.refunds.create({
      charge: order.paymentRecord.stripeChargeId,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: reason || 'admin_refund',
        refundedBy: adminId,
      },
    })

    console.log(`[refund-order] ✅ Refund ${refund.id} erstellt für Order ${order.orderNumber}`)

    // Update PaymentRecord
    await prisma.paymentRecord.update({
      where: { id: order.paymentRecord.id },
      data: {
        stripeRefundId: refund.id,
        refundStatus: refund.status,
        lastWebhookEvent: 'charge.refunded',
        lastWebhookAt: new Date(),
      },
    })

    // Update Order Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeRefundId: refund.id,
        paymentStatus: 'refunded',
        orderStatus: 'canceled',
        refundedAt: new Date(),
        // Wenn Dispute existiert, markiere als resolved
        disputeStatus:
          order.disputeStatus === 'opened' || order.disputeStatus === 'under_review'
            ? 'resolved_refund'
            : order.disputeStatus,
        disputeResolvedAt:
          order.disputeStatus === 'opened' || order.disputeStatus === 'under_review'
            ? new Date()
            : order.disputeResolvedAt,
        disputeResolvedBy:
          order.disputeStatus === 'opened' || order.disputeStatus === 'under_review'
            ? adminId
            : order.disputeResolvedBy,
      },
    })

    console.log(`[refund-order] ✅ Order ${order.orderNumber} - Refund erfolgreich`)

    // Benachrichtigungen
    try {
      // Benachrichtigung an Käufer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'PAYMENT_REFUNDED',
          title: 'Rückerstattung erfolgt',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde zurückerstattet.`,
          link: `/orders/${order.id}`,
        },
      })

      // Benachrichtigung an Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'PAYMENT_REFUNDED',
          title: 'Rückerstattung erfolgt',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde an den Käufer zurückerstattet.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[refund-order] Fehler beim Erstellen der Notifications:`, error)
    }

    return refund.id
  } catch (error: any) {
    console.error(`[refund-order] Fehler bei Refund für Order ${orderId}:`, error)
    throw error
  }
}
