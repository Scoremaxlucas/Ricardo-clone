import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { unblockUserAccountAfterPayment } from '@/lib/invoice-reminders'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe-server'
import { isEventProcessed, markEventProcessed, isTransferCreated, isRefundCreated } from '@/lib/webhook-idempotency'

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

    console.log(`[stripe/webhook] Event empfangen: ${event.type}`)

    // Verarbeite verschiedene Event-Typen
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Prüfe ob es eine Order-Zahlung ist
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        if (paymentIntent.metadata?.orderId) {
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
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`[stripe/webhook] Unbehandeltes Event: ${event.type}`)
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
      console.log(`[stripe/webhook] Checkout Session ${session.id} bereits verarbeitet (Idempotency)`)
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
      console.log(`[stripe/webhook] PaymentRecord für Order ${orderId} noch nicht erstellt, warte auf checkout.session.completed`)
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

    console.log(`[stripe/webhook] ✅ Order ${order.orderNumber} - Transfer erfolgreich, Geld freigegeben`)

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
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log(`[stripe/webhook] Account updated: ${account.id}`)

    // Finde User mit diesem Connected Account
    const user = await prisma.user.findFirst({
      where: { stripeConnectedAccountId: account.id },
      select: { id: true, email: true },
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

    if (isComplete) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeOnboardingComplete: true,
        },
      })

      console.log(`[stripe/webhook] ✅ Onboarding abgeschlossen für User ${user.id}`)

      // Benachrichtigung an User
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACCOUNT_UPDATED',
            title: 'Stripe Onboarding abgeschlossen',
            message: 'Ihr Stripe Connect Account ist jetzt aktiviert. Sie können jetzt Zahlungen empfangen.',
            link: '/seller/onboarding/success',
          },
        })
      } catch (error: any) {
        console.error(`[stripe/webhook] Fehler beim Erstellen der Notification:`, error)
      }
    }
  } catch (error: any) {
    console.error('[stripe/webhook] Fehler bei handleAccountUpdated:', error)
    throw error
  }
}
