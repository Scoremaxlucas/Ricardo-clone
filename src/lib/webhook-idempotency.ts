/**
 * Webhook Idempotency Utilities
 *
 * Verhindert doppelte Verarbeitung von Stripe Webhook Events
 * durch Tracking in einer dedizierten WebhookEvent-Tabelle
 */

import { prisma } from './prisma'

/**
 * Prüft ob ein Webhook Event bereits verarbeitet wurde
 * Verwendet eine dedizierte WebhookEvent-Tabelle für zuverlässige Idempotency
 *
 * @param eventId - Stripe Event ID (evt_xxx)
 * @param eventType - Event Type (z.B. 'payment_intent.succeeded')
 * @returns true wenn bereits verarbeitet, false wenn neu
 */
export async function isEventProcessed(
  eventId: string,
  eventType: string
): Promise<boolean> {
  try {
    // Primäre Prüfung: Dedizierte WebhookEvent-Tabelle
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: eventId },
    })

    if (existingEvent) {
      console.log(`[idempotency] Event ${eventId} bereits verarbeitet (WebhookEvent table)`)
      return true
    }

    // Fallback: Legacy-Prüfung in PaymentRecord (für Migration)
    const existingRecord = await prisma.paymentRecord.findFirst({
      where: {
        lastWebhookEvent: eventId,
      },
    })

    if (existingRecord) {
      console.log(`[idempotency] Event ${eventId} bereits verarbeitet (PaymentRecord legacy)`)
      // Migriere zu WebhookEvent-Tabelle
      await markEventProcessed(eventId, eventType).catch(() => {})
      return true
    }

    return false
  } catch (error: any) {
    console.error(`[idempotency] Fehler beim Prüfen von Event ${eventId}:`, error)
    // Bei Fehler: Sicherheitshalber als nicht verarbeitet behandeln
    return false
  }
}

/**
 * Markiert ein Webhook Event als verarbeitet
 *
 * @param eventId - Stripe Event ID
 * @param eventType - Event Type
 * @param orderId - Related Order ID (optional)
 * @param success - Whether processing succeeded
 * @param errorMessage - Error message if failed
 */
export async function markEventProcessed(
  eventId: string,
  eventType: string,
  orderId?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    // Erstelle WebhookEvent Eintrag (upsert für Idempotency)
    await prisma.webhookEvent.upsert({
      where: { stripeEventId: eventId },
      create: {
        stripeEventId: eventId,
        eventType: eventType,
        orderId: orderId,
        success: success,
        errorMessage: errorMessage,
      },
      update: {
        success: success,
        errorMessage: errorMessage,
      },
    })

    // Auch PaymentRecord aktualisieren für Backward-Compatibility
    if (orderId) {
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
