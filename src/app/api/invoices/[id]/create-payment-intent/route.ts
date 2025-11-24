import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Stripe Client wird in der Route erstellt, wenn STRIPE_SECRET_KEY vorhanden ist

/**
 * Erstellt einen Stripe Payment Intent für eine Rechnung
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Hole Rechnung
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        seller: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Nur der Verkäufer kann die Rechnung bezahlen
    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Zugriff verweigert' },
        { status: 403 }
      )
    }

    // Prüfe ob Rechnung bereits bezahlt ist
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { message: 'Rechnung ist bereits bezahlt' },
        { status: 400 }
      )
    }

    // Prüfe ob Stripe konfiguriert ist
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.trim() === '') {
      return NextResponse.json(
        { message: 'Stripe ist nicht konfiguriert. Bitte setzen Sie STRIPE_SECRET_KEY in der .env Datei. Sie erhalten Test-Keys unter https://dashboard.stripe.com/test/apikeys' },
        { status: 500 }
      )
    }

    // Berechne Betrag in Rappen (CHF * 100)
    const amountInRappen = Math.round(invoice.total * 100)

    // Minimum: 50 Rappen
    if (amountInRappen < 50) {
      return NextResponse.json(
        { message: 'Betrag zu gering (Minimum: CHF 0.50)' },
        { status: 400 }
      )
    }

    // Erstelle Stripe Client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    // Erstelle Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInRappen,
      currency: 'chf',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        sellerId: invoice.sellerId,
        type: 'invoice_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Rechnung ${invoice.invoiceNumber}`,
    })

    console.log(`[invoices/create-payment-intent] Payment Intent erstellt: ${paymentIntent.id} für Rechnung ${invoice.invoiceNumber}`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Payment Intents: ' + error.message },
      { status: 500 }
    )
  }
}

