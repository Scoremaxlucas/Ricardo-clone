import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sicPaths, sicUrl, SIC_BRAND_NAME } from '@/lib/sic/config'
import { normalizeSicModuleIds, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { normalizeEmail } from '@/lib/sic/session'
import { stripe } from '@/lib/stripe-server'
import type { SicModuleKind } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  let email = ''
  let requested: SicModuleId[] = []
  try {
    const body = await req.json()
    email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')
    requested = normalizeSicModuleIds(body?.moduleIds)
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const rl = await checkRateLimit({ identifier: `sic-checkout:${clientIp(req)}`, limit: 20, window: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, message: 'Zu viele Anfragen. Bitte später erneut.' }, { status: 429 })
  }

  // Bestehendes Dossier bestimmt, ob Basisgebühr anfällt und welche Module bereits bezahlt sind.
  const existing = await prisma.sicCertificate.findUnique({
    where: { email },
    select: { modules: { select: { moduleKind: true } } },
  })
  const includeBaseFee = !existing
  const alreadyPaid = new Set<string>((existing?.modules ?? []).map(m => m.moduleKind))
  const candidate = requested.filter(id => !alreadyPaid.has(id))

  if (!includeBaseFee && candidate.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Alle gewählten Module sind bereits Teil Ihres Zertifikats.' },
      { status: 400 }
    )
  }

  const quote = quoteSicOrder({ includeBaseFee, moduleIds: candidate })
  if (quote.totalChf <= 0) {
    return NextResponse.json({ ok: false, message: 'Kein zu zahlender Betrag.' }, { status: 400 })
  }

  // Bundle-Rabatt: negative Positionen sind bei Stripe nicht erlaubt — daher als eine
  // Position zum Gesamtpreis zusammenfassen. Die Fulfillment nutzt Metadaten, nicht die Positionen.
  const hasDiscount = quote.lines.some(l => l.kind === 'discount')
  const lineItems =
    hasDiscount ?
      [
        {
          price_data: {
            currency: 'chf' as const,
            unit_amount: Math.round(quote.totalChf * 100),
            product_data: { name: `${SIC_BRAND_NAME} — Komplett-Paket (Basis + 4 Module)` },
          },
          quantity: 1,
        },
      ]
    : quote.lines.map(l => ({
        price_data: {
          currency: 'chf' as const,
          unit_amount: Math.round(l.amountChf * 100),
          product_data: {
            name: l.kind === 'base' ? `${SIC_BRAND_NAME} — Basis` : `Modul: ${l.label}`,
          },
        },
        quantity: 1,
      }))

  const metadata = {
    type: 'sic_certificate',
    email,
    includeBaseFee: includeBaseFee ? 'true' : 'false',
    moduleKinds: candidate.join(','),
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${sicUrl(sicPaths.checkoutSuccess)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: sicUrl(sicPaths.checkoutCancel),
    })

    await prisma.sicPayment.create({
      data: {
        email,
        includeBaseFee,
        moduleKinds: candidate as SicModuleKind[],
        amountChf: quote.totalChf,
        stripeCheckoutSessionId: session.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('[sic/checkout] stripe session failed', err)
    return NextResponse.json(
      { ok: false, message: 'Zahlung konnte nicht gestartet werden. Bitte später erneut versuchen.' },
      { status: 502 }
    )
  }
}
