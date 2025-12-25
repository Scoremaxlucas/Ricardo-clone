import { unblockUserAccountAfterPayment } from '@/lib/invoice-reminders'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe-server'
import { isEventProcessed, markEventProcessed } from '@/lib/webhook-idempotency'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const webhookSecret = STRIPE_WEBHOOK_SECRET

/**
 * Stripe Webhook Handler
 * Verarbeitet Zahlungsbestätigungen und aktualisiert Rechnungen
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ message: 'Keine Signatur gefunden' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ message: 'Ungültige Signatur' }, { status: 400 })
    }

    console.log(`[stripe/webhook] Event empfangen: ${event.type} (${event.id})`)

    // Global Idempotency Check: Prüfe ob Event bereits verarbeitet wurde
    if (await isEventProcessed(event.id, event.type)) {
      console.log(`[stripe/webhook] Event ${event.id} bereits verarbeitet, überspringe`)
      return NextResponse.json({ received: true, skipped: true })
    }

    let orderId: string | undefined
    let processingError: string | undefined

    try {
      // Verarbeite verschiedene Event-Typen
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Prüfe ob es eine Order-Zahlung ist
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          orderId = paymentIntent.metadata?.orderId
          if (orderId) {
            await handlePaymentIntentSucceeded(paymentIntent)
          } else {
            // Alte Invoice-Logik
            await handlePaymentSuccess(paymentIntent)
          }
          break

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.amount_capturable_updated':
          // TWINT-Zahlungen können hier behandelt werden
          const twintPaymentIntent = event.data.object as Stripe.PaymentIntent
          if (
            twintPaymentIntent.metadata?.type === 'invoice_payment_twint' &&
            twintPaymentIntent.status === 'succeeded'
          ) {
            await handlePaymentSuccess(twintPaymentIntent)
          }
          break

        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session
          orderId = session.metadata?.orderId
          await handleCheckoutSessionCompleted(session)
          break

        case 'transfer.created':
          const transfer = event.data.object as Stripe.Transfer
          orderId = transfer.metadata?.orderId
          await handleTransferCreated(transfer)
          break

        case 'charge.refunded':
          const charge = event.data.object as Stripe.Charge
          orderId = charge.metadata?.orderId
          await handleChargeRefunded(charge)
          break

        case 'account.updated':
          await handleAccountUpdated(event.data.object as Stripe.Account)
          break

        default:
          console.log(`[stripe/webhook] Unbehandeltes Event: ${event.type}`)
      }

      // Mark event as successfully processed
      await markEventProcessed(event.id, event.type, orderId, true)
    } catch (processingErr: any) {
      processingError = processingErr.message
      // Mark event as failed (so we can retry or investigate)
      await markEventProcessed(event.id, event.type, orderId, false, processingError)
      throw processingErr // Re-throw to return 500 to Stripe
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { message: 'Fehler bei Webhook-Verarbeitung: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * Verarbeitet erfolgreiche Zahlung
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId
    const invoiceNumber = paymentIntent.metadata?.invoiceNumber
    const sellerId = paymentIntent.metadata?.sellerId

    if (!invoiceId) {
      console.error('[stripe/webhook] Keine invoiceId in Metadata gefunden')
      return
    }

    console.log(`[stripe/webhook] Zahlung erfolgreich für Rechnung ${invoiceNumber}`)

    // Bestimme Zahlungsmethode basierend auf Payment Intent Metadata
    const paymentMethod =
      paymentIntent.metadata?.type === 'invoice_payment_twint' ? 'twint' : 'creditcard'

    // Update Rechnung
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: paymentMethod,
        paymentReference: paymentIntent.id,
        paymentConfirmedAt: new Date(),
      },
    })

    console.log(`[stripe/webhook] ✅ Rechnung ${invoiceNumber} als bezahlt markiert`)

    // Prüfe ob Konto entsperrt werden kann
    if (sellerId) {
      try {
        await unblockUserAccountAfterPayment(sellerId)
      } catch (error: any) {
        console.error(`[stripe/webhook] Fehler beim Entsperren des Kontos:`, error)
      }
    }

    // Benachrichtigung an Verkäufer
    if (sellerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: sellerId,
            type: 'PAYMENT_CONFIRMED',
            title: 'Zahlung bestätigt',
            message: `Ihre Rechnung ${invoiceNumber} wurde erfolgreich bezahlt.`,
            link: `/my-watches/selling/fees?invoice=${invoiceId}`,
          },
        })
      } catch (error: any) {
        console.error(`[stripe/webhook] Fehler beim Erstellen der Notification:`, error)
      }
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handlePaymentSuccess:', error)
    throw error
  }
}

/**
 * Verarbeitet fehlgeschlagene Zahlung
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId
    const invoiceNumber = paymentIntent.metadata?.invoiceNumber
    const sellerId = paymentIntent.metadata?.sellerId

    if (!invoiceId) {
      console.error('[stripe/webhook] Keine invoiceId in Metadata gefunden')
      return
    }

    console.log(`[stripe/webhook] Zahlung fehlgeschlagen für Rechnung ${invoiceNumber}`)

    // Benachrichtigung an Verkäufer
    if (sellerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: sellerId,
            type: 'PAYMENT_FAILED',
            title: 'Zahlung fehlgeschlagen',
            message: `Die Zahlung für Rechnung ${invoiceNumber} ist fehlgeschlagen. Bitte versuchen Sie es erneut.`,
            link: `/my-watches/selling/fees?invoice=${invoiceId}`,
          },
        })
      } catch (error: any) {
        console.error(`[stripe/webhook] Fehler beim Erstellen der Notification:`, error)
      }
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handlePaymentFailed:', error)
    throw error
  }
}

/**
 * Verarbeitet abgeschlossene Checkout Session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const orderId = session.metadata?.orderId

    if (!orderId) {
      // Prüfe ob es eine Invoice-Zahlung ist (alte Logik)
      const invoiceId = session.metadata?.invoiceId
      if (invoiceId) {
        console.log('[stripe/webhook] Checkout Session für Invoice, überspringe Order-Verarbeitung')
        return
      }
      console.log('[stripe/webhook] Keine orderId in Checkout Session Metadata gefunden')
      return
    }

    // Idempotency Check: Prüfe ob Event bereits verarbeitet wurde
    if (await isEventProcessed(session.id, 'checkout.session.completed')) {
      console.log(
        `[stripe/webhook] Checkout Session ${session.id} bereits verarbeitet (Idempotency)`
      )
      return
    }

    console.log(`[stripe/webhook] Checkout Session abgeschlossen für Order ${orderId}`)

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        watch: true,
        buyer: true,
        seller: true,
      },
    })

    if (!order) {
      console.error(`[stripe/webhook] Order ${orderId} nicht gefunden`)
      return
    }

    // Prüfe ob PaymentRecord bereits existiert (Idempotenz)
    let paymentRecord = await prisma.paymentRecord.findUnique({
      where: { orderId },
    })

    // Hole PaymentIntent Details von Stripe
    const paymentIntentId = session.payment_intent as string
    if (!paymentIntentId) {
      console.error(`[stripe/webhook] Kein PaymentIntent in Checkout Session ${session.id}`)
      return
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Hole Charge Details
    const chargeId = paymentIntent.latest_charge as string
    let charge: Stripe.Charge | null = null
    if (chargeId) {
      try {
        charge = await stripe.charges.retrieve(chargeId)
      } catch (e) {
        console.error(`[stripe/webhook] Fehler beim Laden des Charges:`, e)
      }
    }

    // Berechne Seller Amount (Item-Preis - Plattform-Gebühr)
    const sellerAmount = order.itemPrice - order.platformFee

    // Erstelle oder Update PaymentRecord
    if (!paymentRecord) {
      paymentRecord = await prisma.paymentRecord.create({
        data: {
          orderId: order.id,
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: chargeId || null,
          stripeCheckoutSessionId: session.id,
          amount: order.totalAmount,
          currency: 'chf',
          platformFee: order.platformFee,
          sellerAmount: sellerAmount,
          paymentStatus: 'paid',
          lastWebhookEvent: 'checkout.session.completed',
          lastWebhookAt: new Date(),
        },
      })
      console.log(`[stripe/webhook] ✅ PaymentRecord erstellt für Order ${orderId}`)
    } else {
      // Update bestehendes PaymentRecord
      paymentRecord = await prisma.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          stripeChargeId: chargeId || paymentRecord.stripeChargeId,
          stripeCheckoutSessionId: session.id,
          paymentStatus: 'paid',
          lastWebhookEvent: 'checkout.session.completed',
          lastWebhookAt: new Date(),
        },
      })
      console.log(`[stripe/webhook] ✅ PaymentRecord aktualisiert für Order ${orderId}`)
    }

    // Berechne Auto-Release Zeitpunkt (72 Stunden nach Zahlung)
    const autoReleaseAt = new Date()
    autoReleaseAt.setHours(
      autoReleaseAt.getHours() + parseInt(process.env.AUTO_RELEASE_TIMEOUT_HOURS || '72')
    )

    // Update Order Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: chargeId || null,
        stripeCheckoutSessionId: session.id,
        paymentStatus: 'paid',
        orderStatus: 'processing',
        paidAt: new Date(),
        autoReleaseAt: autoReleaseAt,
      },
    })

    console.log(`[stripe/webhook] ✅ Order ${order.orderNumber} als bezahlt markiert`)

    // WICHTIG: Aktualisiere auch das zugehörige Purchase-Record
    // Purchase und Order sind verknüpft über watchId und buyerId
    try {
      const purchaseUpdate = await prisma.purchase.updateMany({
        where: {
          watchId: order.watchId,
          buyerId: order.buyerId,
        },
        data: {
          paymentConfirmed: true,
          paymentConfirmedAt: new Date(),
          paid: true,
          status: 'processing',
        },
      })
      console.log(`[stripe/webhook] ✅ ${purchaseUpdate.count} Purchase(s) als bezahlt markiert`)
    } catch (purchaseError: any) {
      console.error(`[stripe/webhook] Fehler beim Aktualisieren des Purchases:`, purchaseError)
      // Nicht kritisch - Order ist bereits aktualisiert
    }

    // WICHTIG: Benachrichtige Verkäufer über Stripe-Onboarding wenn noch nicht eingerichtet
    // JIT-Onboarding: Verkäufer muss Stripe einrichten um Auszahlung zu erhalten
    if (!order.seller.stripeConnectedAccountId || !order.seller.stripeOnboardingComplete) {
      try {
        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            type: 'PAYOUT_SETUP_REQUIRED',
            title: 'Auszahlung einrichten',
            message: `Sie haben eine Zahlung für "${order.watch.title || 'Artikel'}" erhalten. Richten Sie Ihre Auszahlungsdaten ein, um das Geld zu erhalten.`,
            link: '/my-watches/account?setup_payout=1',
          },
        })
        console.log(`[stripe/webhook] ✅ Verkäufer-Benachrichtigung für Stripe-Onboarding erstellt`)
      } catch (notifError: any) {
        console.error(
          `[stripe/webhook] Fehler beim Erstellen der Onboarding-Notification:`,
          notifError
        )
      }
    }

    // Benachrichtigungen
    try {
      // Benachrichtigung an Käufer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'ORDER_PAID',
          title: 'Zahlung erfolgreich',
          message: `Ihre Bestellung ${order.orderNumber} wurde erfolgreich bezahlt. Das Geld wird geschützt gehalten.`,
          link: `/orders/${order.id}`,
        },
      })

      // Benachrichtigung an Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'ORDER_PAID',
          title: 'Neue Bestellung erhalten',
          message: `Eine neue Bestellung ${order.orderNumber} wurde bezahlt. Das Geld wird nach Erhalt der Ware freigegeben.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[stripe/webhook] Fehler beim Erstellen der Notifications:`, error)
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handleCheckoutSessionCompleted:', error)
    throw error
  }
}

/**
 * Verarbeitet erfolgreichen PaymentIntent (für Orders)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId

    if (!orderId) {
      console.log('[stripe/webhook] Keine orderId in PaymentIntent Metadata gefunden')
      return
    }

    console.log(`[stripe/webhook] PaymentIntent erfolgreich für Order ${orderId}`)

    // Prüfe ob PaymentRecord existiert
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { orderId },
    })

    if (!paymentRecord) {
      console.log(
        `[stripe/webhook] PaymentRecord für Order ${orderId} noch nicht erstellt, warte auf checkout.session.completed`
      )
      return
    }

    // Update PaymentRecord mit PaymentIntent Info
    const chargeId = paymentIntent.latest_charge as string

    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: chargeId || paymentRecord.stripeChargeId,
        paymentStatus: 'paid',
        lastWebhookEvent: 'payment_intent.succeeded',
        lastWebhookAt: new Date(),
      },
    })

    console.log(`[stripe/webhook] ✅ PaymentRecord aktualisiert für Order ${orderId}`)
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handlePaymentIntentSucceeded:', error)
    throw error
  }
}

/**
 * Verarbeitet erstellten Transfer
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    const orderId = transfer.metadata?.orderId

    if (!orderId) {
      console.log('[stripe/webhook] Keine orderId in Transfer Metadata gefunden')
      return
    }

    console.log(`[stripe/webhook] Transfer erstellt für Order ${orderId}`)

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      console.error(`[stripe/webhook] Order ${orderId} nicht gefunden`)
      return
    }

    // Update PaymentRecord
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { orderId },
    })

    if (paymentRecord) {
      await prisma.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          stripeTransferId: transfer.id,
          transferStatus: transfer.reversed ? 'reversed' : 'paid',
          lastWebhookEvent: 'transfer.created',
          lastWebhookAt: new Date(),
        },
      })
      console.log(`[stripe/webhook] ✅ PaymentRecord Transfer aktualisiert für Order ${orderId}`)
    }

    // Update Order Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeTransferId: transfer.id,
        paymentStatus: 'released',
        releasedAt: new Date(),
        orderStatus: 'completed',
      },
    })

    console.log(
      `[stripe/webhook] ✅ Order ${order.orderNumber} - Transfer erfolgreich, Geld freigegeben`
    )

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
      console.error(`[stripe/webhook] Fehler beim Erstellen der Notifications:`, error)
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handleTransferCreated:', error)
    throw error
  }
}

/**
 * Verarbeitet Refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const orderId = charge.metadata?.orderId

    if (!orderId) {
      console.log('[stripe/webhook] Keine orderId in Charge Metadata gefunden')
      return
    }

    console.log(`[stripe/webhook] Refund für Order ${orderId}`)

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecord: true,
      },
    })

    if (!order) {
      console.error(`[stripe/webhook] Order ${orderId} nicht gefunden`)
      return
    }

    // Hole Refund Details von Stripe
    const refunds = await stripe.refunds.list({
      charge: charge.id,
      limit: 1,
    })

    const refund = refunds.data[0]
    const refundId = refund?.id

    // Update PaymentRecord
    if (order.paymentRecord) {
      await prisma.paymentRecord.update({
        where: { id: order.paymentRecord.id },
        data: {
          stripeRefundId: refundId || null,
          refundStatus: refund?.status || 'succeeded',
          lastWebhookEvent: 'charge.refunded',
          lastWebhookAt: new Date(),
        },
      })
      console.log(`[stripe/webhook] ✅ PaymentRecord Refund aktualisiert für Order ${orderId}`)
    }

    // Update Order Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeRefundId: refundId || null,
        paymentStatus: 'refunded',
        orderStatus: 'canceled',
        refundedAt: new Date(),
      },
    })

    console.log(`[stripe/webhook] ✅ Order ${order.orderNumber} - Refund erfolgreich`)

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
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde zurückerstattet.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[stripe/webhook] Fehler beim Erstellen der Notifications:`, error)
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handleChargeRefunded:', error)
    throw error
  }
}

/**
 * Verarbeitet Account Updates (für Connect Onboarding)
 * Just-in-Time Onboarding: Aktualisiert Status und ermöglicht ausstehende Auszahlungen
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log(`[stripe/webhook] Account updated: ${account.id}`)

    // Finde User mit diesem Connected Account
    const user = await prisma.user.findFirst({
      where: { stripeConnectedAccountId: account.id },
      select: {
        id: true,
        email: true,
        connectOnboardingStatus: true,
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
      },
    })

    if (!user) {
      console.log(`[stripe/webhook] Kein User gefunden für Account ${account.id}`)
      return
    }

    // Prüfe ob Onboarding abgeschlossen ist
    const isComplete =
      account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true

    const newStatus = isComplete ? 'COMPLETE' : 'INCOMPLETE'
    const wasIncomplete = user.connectOnboardingStatus !== 'COMPLETE'

    // Update User Status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        connectOnboardingStatus: newStatus,
        stripeOnboardingComplete: isComplete,
        payoutsEnabled: account.payouts_enabled === true,
      },
    })

    console.log(
      `[stripe/webhook] ✅ Onboarding-Status aktualisiert für User ${user.id}: ${newStatus}`
    )

    // Wenn Onboarding jetzt abgeschlossen ist und vorher nicht war
    if (isComplete && wasIncomplete) {
      console.log(`[stripe/webhook] ✅ Onboarding abgeschlossen für User ${user.id}`)

      // Konfiguriere Payout-Schedule für schnellere Auszahlungen (täglich statt wöchentlich)
      try {
        const { configurePayoutSchedule } = await import('@/lib/stripe-payout-schedule')
        const scheduleResult = await configurePayoutSchedule(account.id)
        if (scheduleResult.success) {
          console.log(`[stripe/webhook] ✅ Payout schedule configured: ${scheduleResult.schedule}`)
        } else {
          console.log(
            `[stripe/webhook] ⚠️ Could not auto-configure payout schedule: ${scheduleResult.message}`
          )
        }
      } catch (scheduleError: any) {
        // Nicht kritisch - Seller kann es manuell in Stripe Dashboard konfigurieren
        console.log(
          `[stripe/webhook] ⚠️ Payout schedule configuration skipped: ${scheduleError.message}`
        )
      }

      // Benachrichtigung an User (Helvenda-Wording, keine Stripe-Erwähnung)
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACCOUNT_UPDATED',
            title: 'Auszahlung eingerichtet',
            message:
              'Ihre Auszahlungsdaten wurden erfolgreich hinterlegt. Sie können jetzt Zahlungen empfangen.',
            link: '/my-watches/account',
          },
        })
      } catch (error: any) {
        console.error(`[stripe/webhook] Fehler beim Erstellen der Notification:`, error)
      }

      // Prüfe ob ausstehende Auszahlungen (RELEASE_PENDING_ONBOARDING) existieren
      const pendingOrders = await prisma.order.findMany({
        where: {
          sellerId: user.id,
          paymentStatus: 'release_pending_onboarding',
        },
      })

      if (pendingOrders.length > 0) {
        console.log(
          `[stripe/webhook] ${pendingOrders.length} ausstehende Auszahlungen für User ${user.id}`
        )

        // Benachrichtige User über ausstehende Auszahlungen
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'PAYOUT_READY',
              title: 'Auszahlungen bereit',
              message: `${pendingOrders.length} Auszahlung${pendingOrders.length > 1 ? 'en' : ''} kann jetzt verarbeitet werden.`,
              link: '/my-watches/selling/payouts',
            },
          })
        } catch (error: any) {
          console.error(`[stripe/webhook] Fehler beim Erstellen der Notification:`, error)
        }
      }
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handleAccountUpdated:', error)
    throw error
  }
}
