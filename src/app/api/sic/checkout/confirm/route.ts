import { fulfillSicPaidCheckout } from '@/lib/sic/fulfillment'
import {
  SIC_POST_CHECKOUT_TTL_SECONDS,
  SIC_SESSION_COOKIE,
  sicSessionCookieOptions,
  signSicSessionToken,
} from '@/lib/sic/session'
import { stripe } from '@/lib/stripe-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function setShortSession(res: NextResponse, email: string): NextResponse {
  res.cookies.set(
    SIC_SESSION_COOKIE,
    signSicSessionToken(email, SIC_POST_CHECKOUT_TTL_SECONDS),
    sicSessionCookieOptions(SIC_POST_CHECKOUT_TTL_SECONDS)
  )
  return res
}

/**
 * Bestätigt eine Checkout-Session serverseitig (Fallback zum Webhook). Idempotent:
 * verifiziert bei Stripe, ob bezahlt, und wendet sie auf das Dossier an.
 *
 * Bei Erfolg gibt es eine Sitzung für 24 Stunden, damit Uploads ohne Magic-Link
 * weitergehen. Die Session-ID allein soll kein Dauerticket in ein fremdes Dossier sein.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id') || ''
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: 'session_id fehlt.' }, { status: 400 })
  }

  try {
    if (sessionId.startsWith('free_')) {
      const result = await fulfillSicPaidCheckout({ stripeCheckoutSessionId: sessionId })
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, message: 'Verarbeitung fehlgeschlagen.' },
          { status: 500 }
        )
      }
      const res = NextResponse.json({ ok: true, email: result.email })
      return result.email ? setShortSession(res, result.email) : res
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        ok: false,
        pending: true,
        message: 'Zahlung noch nicht bestätigt.',
      })
    }

    const result = await fulfillSicPaidCheckout({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: 'Verarbeitung fehlgeschlagen.' },
        { status: 500 }
      )
    }

    const res = NextResponse.json({ ok: true, email: result.email })
    return result.email ? setShortSession(res, result.email) : res
  } catch (err) {
    console.error('[sic/checkout/confirm]', err)
    return NextResponse.json({ ok: false, message: 'Fehler bei der Bestätigung.' }, { status: 502 })
  }
}
