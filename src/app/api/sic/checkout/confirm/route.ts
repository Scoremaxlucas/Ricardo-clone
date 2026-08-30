import { fulfillSicPaidCheckout } from '@/lib/sic/fulfillment'
import { prisma } from '@/lib/prisma'
import {
  SIC_POST_CHECKOUT_TTL_SECONDS,
  SIC_SESSION_COOKIE,
  sicPaidCheckoutAllowsSessionCookie,
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

async function respondAfterFulfill(opts: {
  sessionId: string
  result: Awaited<ReturnType<typeof fulfillSicPaidCheckout>>
}): Promise<NextResponse> {
  if (!opts.result.ok) {
    return NextResponse.json({ ok: false, message: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }
  const payment = await prisma.sicPayment.findUnique({
    where: { stripeCheckoutSessionId: opts.sessionId },
    select: { paidAt: true },
  })
  const res = NextResponse.json({ ok: true })
  if (opts.result.email && sicPaidCheckoutAllowsSessionCookie(payment?.paidAt)) {
    return setShortSession(res, opts.result.email)
  }
  return res
}

/**
 * Bestätigt eine Checkout-Session serverseitig (Fallback zum Webhook). Idempotent:
 * verifiziert bei Stripe, ob bezahlt, und wendet sie auf das Dossier an.
 *
 * Eine Sitzung gibt es nur, wenn die Zahlung frisch ist (Minuten, nicht der
 * ganze Folgetag). Die Session-ID in der History soll kein Dauerticket sein.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id') || ''
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: 'session_id fehlt.' }, { status: 400 })
  }

  try {
    if (sessionId.startsWith('free_')) {
      const result = await fulfillSicPaidCheckout({ stripeCheckoutSessionId: sessionId })
      return respondAfterFulfill({ sessionId, result })
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
        typeof session.payment_intent === 'string' ?
          session.payment_intent
        : (session.payment_intent?.id ?? null),
    })

    return respondAfterFulfill({ sessionId: session.id, result })
  } catch (err) {
    console.error('[sic/checkout/confirm]', err)
    return NextResponse.json({ ok: false, message: 'Fehler bei der Bestätigung.' }, { status: 502 })
  }
}
