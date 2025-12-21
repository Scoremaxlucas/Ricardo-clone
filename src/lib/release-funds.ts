import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { calculateSellerAmount } from './order-fees'
import { isTransferCreated } from './webhook-idempotency'

export interface ReleaseFundsResult {
  success: boolean
  transferId?: string | null
  pendingOnboarding?: boolean
  message?: string
}

/**
 * Gibt Gelder für eine Order frei (Transfer an Verkäufer)
 * Just-in-Time Onboarding: Wenn Verkäufer nicht onboarded ist,
 * wird Order auf RELEASE_PENDING_ONBOARDING gesetzt
 *
 * @param orderId - Die Order ID
 * @returns ReleaseFundsResult mit Status und ggf. Transfer ID
 */
export async function releaseFunds(orderId: string): Promise<ReleaseFundsResult> {
  try {
    console.log(`[release-funds] Starte Freigabe für Order ${orderId}`)

    // Lade Order mit allen benötigten Daten
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
            connectOnboardingStatus: true,
            payoutsEnabled: true,
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
      return {
        success: true,
        transferId: order.stripeTransferId || null,
      }
    }

    // Prüfe ob Order bereits freigegeben wurde (zusätzliche Sicherheit)
    if (order.paymentStatus === 'released') {
      console.log(`[release-funds] Order ${orderId} wurde bereits freigegeben`)
      return {
        success: true,
        transferId: order.stripeTransferId || null,
      }
    }

    // Prüfe ob Order bezahlt wurde
    if (
      order.paymentStatus !== 'paid' &&
      order.paymentStatus !== 'release_pending' &&
      order.paymentStatus !== 'release_pending_onboarding'
    ) {
      throw new Error(`Order ${orderId} ist nicht bezahlt (Status: ${order.paymentStatus})`)
    }

    // JUST-IN-TIME ONBOARDING: Prüfe ob Verkäufer Stripe Connect Account hat
    const sellerOnboardingComplete =
      order.seller.stripeConnectedAccountId &&
      order.seller.stripeOnboardingComplete &&
      order.seller.connectOnboardingStatus === 'COMPLETE'

    if (!sellerOnboardingComplete) {
      console.log(
        `[release-funds] Verkäufer ${order.sellerId} nicht onboarded - setze Order auf RELEASE_PENDING_ONBOARDING`
      )

      // Setze Order auf ausstehend (wartet auf Onboarding)
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'release_pending_onboarding',
        },
      })

      // Benachrichtige Verkäufer (Helvenda-Wording)
      try {
        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            type: 'PAYOUT_PENDING_ONBOARDING',
            title: 'Auszahlung ausstehend',
            message: `Eine Auszahlung für Bestellung ${order.orderNumber} wartet auf Sie. Bitte richten Sie Ihre Auszahlungsdaten ein, um die Zahlung zu erhalten.`,
            link: '/my-watches/account?setup_payout=1',
          },
        })
      } catch (notifError: any) {
        console.error(`[release-funds] Fehler beim Erstellen der Notification:`, notifError)
      }

      return {
        success: false,
        pendingOnboarding: true,
        message: 'Auszahlung ausstehend - Auszahlungsdaten müssen eingerichtet werden',
      }
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
    // Note: stripeConnectedAccountId is guaranteed non-null here due to sellerOnboardingComplete check above
    const transfer = await stripe.transfers.create({
      amount: Math.round(sellerAmount * 100), // In Rappen
      currency: 'chf',
      destination: order.seller.stripeConnectedAccountId!,
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

    // Benachrichtigungen (Helvenda-Wording)
    try {
      // Benachrichtigung an Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'PAYMENT_RELEASED',
          title: 'Auszahlung erfolgt',
          message: `Das Geld für Bestellung ${order.orderNumber} wurde erfolgreich freigegeben und wird auf Ihr Bankkonto überwiesen.`,
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

    return {
      success: true,
      transferId: transfer.id,
    }
  } catch (error: any) {
    console.error(`[release-funds] Fehler bei Freigabe für Order ${orderId}:`, error)
    throw error
  }
}

/**
 * Verarbeitet alle ausstehenden Auszahlungen für einen Verkäufer
 * nach Abschluss des Onboardings
 *
 * @param sellerId - Die User ID des Verkäufers
 * @returns Anzahl der verarbeiteten Orders
 */
export async function processPendingPayoutsForSeller(sellerId: string): Promise<number> {
  try {
    // Lade Verkäufer
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
        connectOnboardingStatus: true,
      },
    })

    if (!seller) {
      throw new Error(`Verkäufer ${sellerId} nicht gefunden`)
    }

    // Prüfe ob Onboarding abgeschlossen
    if (
      !seller.stripeConnectedAccountId ||
      !seller.stripeOnboardingComplete ||
      seller.connectOnboardingStatus !== 'COMPLETE'
    ) {
      console.log(`[release-funds] Verkäufer ${sellerId} ist noch nicht onboarded`)
      return 0
    }

    // Finde alle ausstehenden Orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        sellerId: sellerId,
        paymentStatus: 'release_pending_onboarding',
      },
    })

    if (pendingOrders.length === 0) {
      console.log(`[release-funds] Keine ausstehenden Auszahlungen für Verkäufer ${sellerId}`)
      return 0
    }

    console.log(
      `[release-funds] Verarbeite ${pendingOrders.length} ausstehende Auszahlungen für Verkäufer ${sellerId}`
    )

    let processedCount = 0

    for (const order of pendingOrders) {
      try {
        const result = await releaseFunds(order.id)
        if (result.success) {
          processedCount++
          console.log(`[release-funds] ✅ Order ${order.orderNumber} erfolgreich verarbeitet`)
        }
      } catch (orderError: any) {
        console.error(
          `[release-funds] Fehler bei Order ${order.orderNumber}:`,
          orderError.message
        )
      }
    }

    console.log(
      `[release-funds] ✅ ${processedCount}/${pendingOrders.length} Auszahlungen erfolgreich verarbeitet`
    )

    return processedCount
  } catch (error: any) {
    console.error(`[release-funds] Fehler bei processPendingPayoutsForSeller:`, error)
    throw error
  }
}
