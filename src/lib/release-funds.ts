import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { calculateSellerAmount } from './order-fees'
import { isTransferCreated } from './webhook-idempotency'

/**
 * Gibt Gelder für eine Order frei (Transfer an Verkäufer)
 * @param orderId - Die Order ID
 * @returns Transfer ID oder null bei Fehler
 */
export async function releaseFunds(orderId: string): Promise<string | null> {
  try {
    console.log(`[release-funds] Starte Freigabe für Order ${orderId}`)

    // Lade Order mit allen benötigten Daten
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        paymentRecord: true,
      },
    })

    if (!order) {
      throw new Error(`Order ${orderId} nicht gefunden`)
    }

    // Idempotency Check: Prüfe ob Transfer bereits erstellt wurde
    if (await isTransferCreated(orderId)) {
      console.log(`[release-funds] Order ${orderId} wurde bereits freigegeben (Idempotency Check)`)
      return order.stripeTransferId || null
    }

    // Prüfe ob Order bereits freigegeben wurde (zusätzliche Sicherheit)
    if (order.paymentStatus === 'released') {
      console.log(`[release-funds] Order ${orderId} wurde bereits freigegeben`)
      return order.stripeTransferId || null
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending') {
      throw new Error(`Order ${orderId} ist nicht bezahlt (Status: ${order.paymentStatus})`)
    }

    // Prüfe ob Verkäufer Stripe Connect Account hat
    if (!order.seller.stripeConnectedAccountId || !order.seller.stripeOnboardingComplete) {
      throw new Error(`Verkäufer hat keinen aktiven Stripe Connect Account`)
    }

    // Prüfe ob PaymentRecord existiert
    if (!order.paymentRecord) {
      throw new Error(`PaymentRecord für Order ${orderId} nicht gefunden`)
    }

    // Prüfe ob Charge existiert
    if (!order.paymentRecord.stripeChargeId) {
      throw new Error(`Charge für Order ${orderId} nicht gefunden`)
    }

    // Berechne Seller Amount (Item-Preis - Plattform-Gebühr)
    const sellerAmount = calculateSellerAmount(order.itemPrice, order.platformFee)

    // Erstelle Transfer zu Stripe Connected Account
    // WICHTIG: Separate Charges and Transfers Pattern
    const transfer = await stripe.transfers.create({
      amount: Math.round(sellerAmount * 100), // In Rappen
      currency: 'chf',
      destination: order.seller.stripeConnectedAccountId,
      source_transaction: order.paymentRecord.stripeChargeId, // Verknüpft Transfer mit Charge
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
      },
    })

    console.log(`[release-funds] ✅ Transfer ${transfer.id} erstellt für Order ${order.orderNumber}`)

    // Update PaymentRecord
    await prisma.paymentRecord.update({
      where: { id: order.paymentRecord.id },
      data: {
        stripeTransferId: transfer.id,
        transferStatus: 'paid',
        lastWebhookEvent: 'transfer.created',
        lastWebhookAt: new Date(),
      },
    })

    // Update Order Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeTransferId: transfer.id,
        paymentStatus: 'released',
        orderStatus: 'completed',
        releasedAt: new Date(),
      },
    })

    console.log(`[release-funds] ✅ Order ${order.orderNumber} - Geld erfolgreich freigegeben`)

    // Benachrichtigungen
    try {
      // Benachrichtigung an Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'PAYMENT_RELEASED',
          title: 'Zahlung freigegeben',
          message: `Das Geld für Bestellung ${order.orderNumber} wurde erfolgreich freigegeben und wird Ihnen überwiesen.`,
          link: `/orders/${order.id}`,
        },
      })

      // Benachrichtigung an Käufer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'PAYMENT_RELEASED',
          title: 'Zahlung freigegeben',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde erfolgreich an den Verkäufer freigegeben.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[release-funds] Fehler beim Erstellen der Notifications:`, error)
    }

    return transfer.id
  } catch (error: any) {
    console.error(`[release-funds] Fehler bei Freigabe für Order ${orderId}:`, error)
    throw error
  }
}
