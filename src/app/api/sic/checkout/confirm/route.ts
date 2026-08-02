import { fulfillSicPaidCheckout } from '@/lib/sic/fulfillment'
import { stripe } from '@/lib/stripe-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Bestätigt eine Checkout-Session serverseitig (Fallback zum Webhook). Idempotent:
 * verifiziert bei Stripe, ob bezahlt, und wendet sie auf das Dossier an.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id') || ''
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: 'session_id fehlt.' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ ok: false, pending: true, message: 'Zahlung noch nicht bestätigt.' })
    }

    const result = await fulfillSicPaidCheckout({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string' ?
          session.payment_intent
        : (session.payment_intent?.id ?? null),
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email: result.email })
  } catch (err) {
    console.error('[sic/checkout/confirm]', err)
    return NextResponse.json({ ok: false, message: 'Fehler bei der Bestätigung.' }, { status: 502 })
  }
}
