/**
 * Webhook Idempotency Utilities
 *
 * Verhindert doppelte Verarbeitung von Stripe Webhook Events
 * durch Tracking von bereits verarbeiteten Events
 */

import { prisma } from './prisma'

/**
 * Prüft ob ein Webhook Event bereits verarbeitet wurde
 *
 * @param eventId - Stripe Event ID
 * @param eventType - Event Type (z.B. 'payment_intent.succeeded')
 * @returns true wenn bereits verarbeitet, false wenn neu
 */
export async function isEventProcessed(
  eventId: string,
  eventType: string
): Promise<boolean> {
  try {
    // Prüfe in PaymentRecord (für Order-Events)
    const existingRecord = await prisma.paymentRecord.findFirst({
      where: {
        lastWebhookEvent: eventId,
      },
    })

    if (existingRecord) {
      console.log(`[idempotency] Event ${eventId} bereits verarbeitet (PaymentRecord)`)
      return true
    }

    // Prüfe in Order (für Order-spezifische Events)
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { stripePaymentIntentId: eventId },
          { stripeChargeId: eventId },
          { stripeTransferId: eventId },
          { stripeRefundId: eventId },
        ],
      },
    })

    if (existingOrder) {
      console.log(`[idempotency] Event ${eventId} bereits verarbeitet (Order)`)
      return true
    }

    // TODO: Erweitere um eine dedizierte WebhookEvent-Tabelle für vollständige Idempotency
    // Aktuell verwenden wir PaymentRecord.lastWebhookEvent als Tracking-Mechanismus

    return false
  } catch (error: any) {
    console.error(`[idempotency] Fehler beim Prüfen von Event ${eventId}:`, error)
    // Bei Fehler: Sicherheitshalber als nicht verarbeitet behandeln
    // (besser einmal zu viel verarbeiten als einmal zu wenig)
    return false
  }
}

/**
 * Markiert ein Webhook Event als verarbeitet
 *
 * @param orderId - Order ID (optional)
 * @param paymentRecordId - PaymentRecord ID (optional)
 * @param eventId - Stripe Event ID
 * @param eventType - Event Type
 */
export async function markEventProcessed(
  eventId: string,
  eventType: string,
  orderId?: string,
  paymentRecordId?: string
): Promise<void> {
  try {
    // Update PaymentRecord wenn vorhanden
    if (paymentRecordId) {
      await prisma.paymentRecord.update({
        where: { id: paymentRecordId },
        data: {
          lastWebhookEvent: eventId,
          lastWebhookAt: new Date(),
        },
      })
    } else if (orderId) {
      // Update via Order -> PaymentRecord Relation
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { paymentRecord: true },
      })

      if (order?.paymentRecord) {
        await prisma.paymentRecord.update({
          where: { id: order.paymentRecord.id },
          data: {
            lastWebhookEvent: eventId,
            lastWebhookAt: new Date(),
          },
        })
      }
    }
  } catch (error: any) {
    console.error(`[idempotency] Fehler beim Markieren von Event ${eventId}:`, error)
    // Fehler nicht werfen - Idempotency ist nicht kritisch genug um die Verarbeitung zu stoppen
  }
}

/**
 * Prüft ob eine Transfer bereits erstellt wurde (verhindert doppelte Transfers)
 */
export async function isTransferCreated(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        stripeTransferId: true,
        paymentStatus: true,
      },
    })

    return !!(order?.stripeTransferId || order?.paymentStatus === 'released')
  } catch (error: any) {
    console.error(`[idempotency] Fehler beim Prüfen von Transfer für Order ${orderId}:`, error)
    return false
  }
}

/**
 * Prüft ob eine Refund bereits erstellt wurde (verhindert doppelte Refunds)
 */
export async function isRefundCreated(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        stripeRefundId: true,
        paymentStatus: true,
      },
    })

    return !!(order?.stripeRefundId || order?.paymentStatus === 'refunded')
  } catch (error: any) {
    console.error(`[idempotency] Fehler beim Prüfen von Refund für Order ${orderId}:`, error)
    return false
  }
}
