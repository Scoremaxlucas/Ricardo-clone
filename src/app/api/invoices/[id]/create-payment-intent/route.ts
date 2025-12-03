import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Stripe Client wird in der Route erstellt, wenn STRIPE_SECRET_KEY vorhanden ist

/**
 * Erstellt einen Stripe Payment Intent für eine Rechnung
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Hole Rechnung
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    // Nur der Verkäufer kann die Rechnung bezahlen
    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    // Prüfe ob Rechnung bereits bezahlt ist
    if (invoice.status === 'paid') {
      return NextResponse.json({ message: 'Rechnung ist bereits bezahlt' }, { status: 400 })
    }

    // Prüfe ob Stripe konfiguriert ist
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.trim() === '') {
      return NextResponse.json(
        {
          message:
            'Stripe ist nicht konfiguriert. Bitte setzen Sie STRIPE_SECRET_KEY in der .env Datei. Sie erhalten Test-Keys unter https://dashboard.stripe.com/test/apikeys',
        },
        { status: 500 }
      )
    }

    // Berechne Betrag in Rappen (CHF * 100)
    const amountInRappen = Math.round(invoice.total * 100)

    // Minimum: 50 Rappen
    if (amountInRappen < 50) {
      return NextResponse.json({ message: 'Betrag zu gering (Minimum: CHF 0.50)' }, { status: 400 })
    }

    // Erstelle Stripe Client
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!stripeSecretKey) {
      console.error('[invoices/create-payment-intent] STRIPE_SECRET_KEY ist nicht gesetzt')
      return NextResponse.json(
        {
          message: 'Stripe Secret Key ist nicht konfiguriert. Bitte setzen Sie STRIPE_SECRET_KEY in Vercel Environment Variables.',
          error: 'STRIPE_SECRET_KEY_MISSING',
        },
        { status: 500 }
      )
    }

    // Prüfe Key-Format
    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('[invoices/create-payment-intent] STRIPE_SECRET_KEY hat ungültiges Format')
      return NextResponse.json(
        {
          message: 'Stripe Secret Key hat ungültiges Format. Der Key sollte mit "sk_test_" oder "sk_live_" beginnen.',
          error: 'STRIPE_SECRET_KEY_INVALID_FORMAT',
        },
        { status: 500 }
      )
    }

    // Debug: Log Key-Präfix (nicht den vollständigen Key!)
    const keyPrefix =
      stripeSecretKey.substring(0, 7) +
      '...' +
      stripeSecretKey.substring(stripeSecretKey.length - 4)
    console.log(`[invoices/create-payment-intent] Verwende Stripe Key: ${keyPrefix}`)

    let stripe: Stripe
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      })
    } catch (stripeInitError: any) {
      console.error('[invoices/create-payment-intent] Fehler beim Initialisieren von Stripe:', stripeInitError)
      return NextResponse.json(
        {
          message: 'Fehler beim Initialisieren von Stripe. Bitte prüfen Sie Ihren STRIPE_SECRET_KEY.',
          error: 'STRIPE_INIT_ERROR',
          details: stripeInitError.message,
        },
        { status: 500 }
      )
    }

    // Erstelle Payment Intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInRappen,
        currency: 'chf',
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          sellerId: invoice.sellerId,
          type: 'invoice_payment',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: `Rechnung ${invoice.invoiceNumber}`,
      })

      console.log(
        `[invoices/create-payment-intent] Payment Intent erstellt: ${paymentIntent.id} für Rechnung ${invoice.invoiceNumber}`
      )

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (stripeError: any) {
      console.error('[invoices/create-payment-intent] Stripe API Fehler:', stripeError)
      console.error('[invoices/create-payment-intent] Stripe Error Type:', stripeError.type)
      console.error('[invoices/create-payment-intent] Stripe Error Message:', stripeError.message)
      console.error('[invoices/create-payment-intent] Stripe Error Code:', stripeError.code)
      
      // Detailliertere Fehlermeldung
      if (stripeError.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          {
            message: `Stripe Authentifizierungsfehler: Bitte prüfen Sie Ihren STRIPE_SECRET_KEY in Vercel Environment Variables. Key-Präfix: ${keyPrefix}`,
            error: 'STRIPE_AUTH_ERROR',
            details: stripeError.message,
          },
          { status: 500 }
        )
      }
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          {
            message: `Stripe API Fehler: ${stripeError.message}`,
            error: 'STRIPE_INVALID_REQUEST',
            details: stripeError.message,
            code: stripeError.code,
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        {
          message: `Stripe Fehler: ${stripeError.message || 'Unbekannter Fehler'}`,
          error: 'STRIPE_ERROR',
          type: stripeError.type,
          details: stripeError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(
      '[invoices/create-payment-intent] Fehler beim Erstellen des Payment Intents:',
      error
    )
    console.error('[invoices/create-payment-intent] Error Stack:', error.stack)

    // Detailliertere Fehlermeldung für den Benutzer
    let errorMessage = 'Fehler beim Erstellen des Payment Intents'
    let errorType = 'UNKNOWN_ERROR'

    if (error.message) {
      errorMessage += ': ' + error.message
    }

    if (error.type === 'StripeAuthenticationError') {
      errorMessage += ' (Stripe Authentifizierungsfehler - bitte prüfen Sie Ihre API Keys in Vercel)'
      errorType = 'STRIPE_AUTH_ERROR'
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: errorType,
        details: error.message,
      },
      { status: 500 }
    )
  }
}
