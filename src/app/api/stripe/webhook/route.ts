import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { unblockUserAccountAfterPayment } from '@/lib/invoice-reminders'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

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
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.amount_capturable_updated':
        // TWINT-Zahlungen können hier behandelt werden
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        if (
          paymentIntent.metadata?.type === 'invoice_payment_twint' &&
          paymentIntent.status === 'succeeded'
        ) {
          await handlePaymentSuccess(paymentIntent)
        }
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
