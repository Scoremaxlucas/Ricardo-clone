import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/[orderId]/checkout
 * Erstellt eine Stripe Checkout Session für eine Order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { orderId } = await params

    // Lade Order mit allen benötigten Daten
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            images: true,
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Käufer ist
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Bestellung zu bezahlen' },
        { status: 403 }
      )
    }

    // Prüfe ob Order bereits bezahlt wurde
    if (order.paymentStatus !== 'created' && order.paymentStatus !== 'awaiting_payment') {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde bereits bezahlt oder ist nicht mehr gültig' },
        { status: 400 }
      )
    }

    // JUST-IN-TIME ONBOARDING: Keine Prüfung ob Verkäufer Stripe hat
    // Die Zahlung geht an Helvenda (Platform), nicht direkt an den Verkäufer
    // Verkäufer muss Stripe erst einrichten wenn er die Auszahlung erhalten möchte
    // Das Geld wird bis dahin sicher bei Helvenda/Stripe gehalten

    // Parse watch images
    let imageUrl: string | undefined
    try {
      if (order.watch.images) {
        const images = JSON.parse(order.watch.images)
        if (Array.isArray(images) && images.length > 0) {
          imageUrl = images[0]
        }
      }
    } catch {
      // Ignore image parsing errors
    }

    // Erstelle Stripe Checkout Session
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Use automatic_payment_methods to enable all methods configured in Stripe Dashboard
      // This includes Card, TWINT, etc. based on your Stripe settings
      customer_email: order.buyer.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'chf',
            unit_amount: Math.round(order.totalAmount * 100), // In Rappen
            product_data: {
              name: order.watch.title || `${order.watch.brand} ${order.watch.model}`,
              description: `Bestellung ${order.orderNumber} - Helvenda Zahlungsschutz`,
              images: imageUrl ? [imageUrl] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      // CRITICAL: Include orderId in metadata for webhook processing
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        watchId: order.watchId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        type: 'order_payment',
      },
      // Also set metadata on PaymentIntent for charge.refunded webhook
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          watchId: order.watchId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          type: 'order_payment',
        },
      },
      success_url: `${baseUrl}/orders/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/orders/${order.id}/cancel`,
    })

    // Update Order mit Checkout Session ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
        orderStatus: 'awaiting_payment',
      },
    })

    console.log(
      `[checkout] Checkout Session ${checkoutSession.id} erstellt für Order ${order.orderNumber}`
    )

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      checkoutSessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Checkout Session',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
