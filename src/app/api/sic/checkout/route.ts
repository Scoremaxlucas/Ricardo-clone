import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sicPaths, sicUrl, SIC_BRAND_NAME, SIC_STRIPE_STATEMENT_SUFFIX } from '@/lib/sic/config'
import { encodePaymentHolderName } from '@/lib/sic/dossier'
import { fulfillSicPaidCheckout } from '@/lib/sic/fulfillment'
import { parseSicHouseholdKind } from '@/lib/sic/household'
import { normalizeSicModuleIds, resolveSicCheckoutModuleIds, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import {
  normalizeEmail,
  SIC_POST_CHECKOUT_TTL_SECONDS,
  SIC_SESSION_COOKIE,
  sicSessionCookieOptions,
  signSicSessionToken,
} from '@/lib/sic/session'
import { getSicSession } from '@/lib/sic/session-cookie'
import { stripe } from '@/lib/stripe-server'
import type { SicModuleKind } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

/**
 * Erkennt Stripe-Ablehnungen, die den `statement_descriptor_suffix` betreffen.
 * Diese Fehler sind reproduzierbar — beim Fallback (Session ohne Suffix)
 * geht die Zahlung durch.
 */
function isDescriptorSuffixError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as { param?: string; message?: string }
  if (typeof anyErr.param === 'string' && anyErr.param.includes('statement_descriptor')) return true
  const msg = typeof anyErr.message === 'string' ? anyErr.message.toLowerCase() : ''
  return msg.includes('statement_descriptor')
}

/**
 * Erkennt vorübergehende Stripe-Fehler (Netzwerk, Rate-Limit, 5xx), bei denen
 * ein Wiederholungsversuch sinnvoll ist. Kartenfehler, Auth-Fehler und
 * Validierungsfehler werden **nicht** wiederholt.
 */
function isTransientStripeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const anyErr = err as { type?: string; code?: string; statusCode?: number; message?: string }
  if (anyErr.type === 'StripeConnectionError' || anyErr.type === 'StripeAPIError') return true
  if (anyErr.type === 'StripeRateLimitError') return true
  if (typeof anyErr.statusCode === 'number' && anyErr.statusCode >= 500) return true
  const msg = typeof anyErr.message === 'string' ? anyErr.message.toLowerCase() : ''
  if (msg.includes('etimedout') || msg.includes('econnreset') || msg.includes('fetch failed')) return true
  return false
}

async function createStripeSessionWithRetry(
  params: Stripe.Checkout.SessionCreateParams,
  opts: { idempotencyKey: string }
): Promise<Stripe.Checkout.Session> {
  const delays = [200, 700]
  let lastErr: unknown
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await stripe.checkout.sessions.create(params, { idempotencyKey: opts.idempotencyKey })
    } catch (err) {
      lastErr = err
      if (attempt === delays.length || !isTransientStripeError(err)) throw err
      console.warn('[sic/checkout] stripe transient error, retrying', {
        attempt: attempt + 1,
        type: (err as { type?: string })?.type,
        code: (err as { code?: string })?.code,
        statusCode: (err as { statusCode?: number })?.statusCode,
      })
      await new Promise(res => setTimeout(res, delays[attempt]))
    }
  }
  throw lastErr
}

function overlaps(a: string[], b: string[]): boolean {
  const set = new Set(a)
  return b.some(x => set.has(x))
}

/** Offene PENDING-Sessions mit überlappenden Modulen bei Stripe expire + DB CANCELLED. */
async function cancelOverlappingPending(email: string, candidate: string[], includeBaseFee: boolean) {
  const pending = await prisma.sicPayment.findMany({
    where: { email, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })
  for (const p of pending) {
    const kinds = (p.moduleKinds as string[]) ?? []
    const overlap =
      overlaps(kinds, candidate) || (includeBaseFee && p.includeBaseFee) || (candidate.length === 0 && kinds.length === 0)
    if (!overlap) continue
    try {
      if (!p.stripeCheckoutSessionId.startsWith('free_')) {
        await stripe.checkout.sessions.expire(p.stripeCheckoutSessionId)
      }
    } catch {
      // Session evtl. schon expired/completed — weiter DB markieren
    }
    await prisma.sicPayment.update({
      where: { id: p.id },
      data: { status: 'CANCELLED' },
    })
  }
}

export async function POST(req: NextRequest) {
  let email = ''
  let requested: SicModuleId[] = []
  let holderName: string | null = null
  let wantsRenewal = false
  try {
    const body = await req.json()
    email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')
    requested = normalizeSicModuleIds(body?.moduleIds)
    wantsRenewal = body?.renewal === true
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
    const firstName2 =
      typeof body?.firstName2 === 'string' ? body.firstName2.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
    const lastName2 =
      typeof body?.lastName2 === 'string' ? body.lastName2.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
    const couple = parseSicHouseholdKind(body?.householdKind) === 'COUPLE' || (!!firstName2 && !!lastName2)
    if (firstName && lastName) {
      if (couple && (!firstName2 || !lastName2)) {
        return NextResponse.json(
          { ok: false, message: 'Bitte Vor- und Nachname der zweiten Person angeben.' },
          { status: 400 }
        )
      }
      holderName = encodePaymentHolderName(firstName, lastName, couple ? firstName2 : null, couple ? lastName2 : null)
    } else if (!wantsRenewal) {
      return NextResponse.json({ ok: false, message: 'Bitte Vor- und Nachname angeben.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (wantsRenewal) {
    const sess = getSicSession()
    if (!sess) {
      return NextResponse.json({ ok: false, message: 'Bitte anmelden, um zu verlängern.' }, { status: 401 })
    }
    email = sess.email
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const rl = await checkRateLimit({ identifier: `sic-checkout:${clientIp(req)}`, limit: 20, window: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, message: 'Zu viele Anfragen. Bitte später erneut.' }, { status: 429 })
  }

  const existing = await prisma.sicCertificate.findUnique({
    where: { email },
    select: { certifiedAt: true, status: true, modules: { select: { moduleKind: true } } },
  })
  const includeBaseFee = !existing
  const alreadyPaid = (existing?.modules ?? []).map(m => m.moduleKind)
  const candidate = resolveSicCheckoutModuleIds({
    includeBaseFee,
    isRenewal: wantsRenewal && !!existing,
    requested,
    alreadyPaid,
  })

  const isRenewal = wantsRenewal && !!existing && !!existing.certifiedAt && existing.status !== 'REVOKED'
  if (wantsRenewal && !isRenewal) {
    return NextResponse.json(
      { ok: false, message: 'Verlängern kannst du erst, wenn ein Zertifikat ausgestellt wurde.' },
      { status: 400 }
    )
  }

  if (!includeBaseFee && !isRenewal && candidate.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Alle gewählten Module sind bereits Teil deines Zertifikats.' },
      { status: 400 }
    )
  }

  const quote = quoteSicOrder({ includeBaseFee, moduleIds: candidate, isRenewal })
  if (quote.totalChf < 0) {
    return NextResponse.json({ ok: false, message: 'Kein gültiger Betrag.' }, { status: 400 })
  }

  await cancelOverlappingPending(email, candidate, includeBaseFee)

  if (quote.totalChf === 0) {
    const sessionId = `free_${crypto.randomUUID()}`
    await prisma.sicPayment.create({
      data: {
        email,
        holderName,
        includeBaseFee,
        isRenewal,
        moduleKinds: candidate as SicModuleKind[],
        amountChf: 0,
        stripeCheckoutSessionId: sessionId,
        status: 'PENDING',
      },
    })
    const result = await fulfillSicPaidCheckout({ stripeCheckoutSessionId: sessionId })
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: 'Zertifikat konnte nicht erstellt werden.' }, { status: 500 })
    }
    const res = NextResponse.json({ ok: true, url: sicPaths.certificateWorkspace })
    res.cookies.set(
      SIC_SESSION_COOKIE,
      signSicSessionToken(email, SIC_POST_CHECKOUT_TTL_SECONDS),
      sicSessionCookieOptions(SIC_POST_CHECKOUT_TTL_SECONDS)
    )
    return res
  }

  // Rabatt (negativ) und Mindestbetrag-Aufschlag lassen sich nicht als eigene
  // Stripe-Positionen abbilden — dann eine Position über das Total.
  const hasDiscount = quote.lines.some(l => l.kind === 'discount')
  const collapseToTotal = hasDiscount || quote.lines.some(l => l.kind === 'minimum')
  const lineItems =
    collapseToTotal ?
      [
        {
          price_data: {
            currency: 'chf' as const,
            unit_amount: Math.round(quote.totalChf * 100),
            product_data: {
              name:
                isRenewal ? `${SIC_BRAND_NAME} — Verlängerung`
                : hasDiscount ? `${SIC_BRAND_NAME} — Komplett-Paket (Basis + 4 Module)`
                : `${SIC_BRAND_NAME} — Mieter-Zertifikat`,
            },
          },
          quantity: 1,
        },
      ]
    : quote.lines.map(l => ({
        price_data: {
          currency: 'chf' as const,
          unit_amount: Math.round(l.amountChf * 100),
          product_data: {
            name:
              l.kind === 'base' ? `${SIC_BRAND_NAME} — Basis`
              : l.kind === 'renewal' ? `${SIC_BRAND_NAME} — Verlängerung`
              : `Modul: ${l.label}`,
          },
        },
        quantity: 1,
      }))

  const metadata = {
    type: 'sic_certificate',
    email,
    includeBaseFee: includeBaseFee ? 'true' : 'false',
    isRenewal: isRenewal ? 'true' : 'false',
    moduleKinds: candidate.join(','),
  }

  // Idempotency-Key stabil pro Request halten — bei Netzwerk-Retry gibt Stripe
  // dieselbe Session zurück, keine Doppel-Sessions.
  const idempotencyKey = `sic-checkout:${email}:${crypto.randomUUID()}`

  // Card-Descriptor-Suffix ist rein kosmetisch («SIC CERT» auf Kartenauszügen
  // statt nur «Helvenda»). Stripe lehnt die Session **konstant** ab, wenn das
  // Konto keinen konfigurierten Descriptor-Präfix hat — genau das war der
  // Grund für die roten Fehlermeldungen bei Zahlungsstart. Deshalb per Env
  // opt-in: erst aktivieren, wenn im Stripe-Dashboard ein
  // «Statement Descriptor (kurz)» gesetzt und getestet ist.
  const wantDescriptorSuffix = process.env.SIC_STRIPE_USE_DESCRIPTOR_SUFFIX === '1'

  const debug = req.nextUrl.searchParams.get('debug') === '1'
  const buildParams = (
    opts: { withDescriptorSuffix: boolean } = { withDescriptorSuffix: wantDescriptorSuffix }
  ): Stripe.Checkout.SessionCreateParams => ({
    mode: 'payment',
    customer_email: email,
    line_items: lineItems,
    metadata,
    payment_intent_data:
      opts.withDescriptorSuffix ?
        { metadata, statement_descriptor_suffix: SIC_STRIPE_STATEMENT_SUFFIX }
      : { metadata },
    success_url: `${sicUrl(sicPaths.checkoutSuccess)}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sicUrl(sicPaths.checkoutCancel)}?session_id={CHECKOUT_SESSION_ID}`,
  })

  try {
    let session: Stripe.Checkout.Session
    try {
      session = await createStripeSessionWithRetry(buildParams(), { idempotencyKey })
    } catch (err) {
      // Selbst-Heilung: Wenn Stripe den Descriptor-Suffix ablehnt, sofort ohne
      // Suffix nochmal versuchen. Kosmetik darf keine Zahlung blockieren.
      if (wantDescriptorSuffix && isDescriptorSuffixError(err)) {
        console.warn('[sic/checkout] descriptor suffix rejected, retrying without', {
          message: (err as { message?: string })?.message,
        })
        session = await createStripeSessionWithRetry(buildParams({ withDescriptorSuffix: false }), {
          idempotencyKey: `${idempotencyKey}:nosuffix`,
        })
      } else {
        throw err
      }
    }

    if (!session.url) {
      console.error('[sic/checkout] stripe session created without url', { id: session.id })
      return NextResponse.json(
        {
          ok: false,
          code: 'stripe_transient',
          message:
            'Die Zahlung startete gerade nicht — bitte gleich nochmal versuchen. Deine Angaben bleiben erhalten.',
        },
        { status: 502 }
      )
    }

    await prisma.sicPayment.create({
      data: {
        email,
        holderName,
        includeBaseFee,
        isRenewal,
        moduleKinds: candidate as SicModuleKind[],
        amountChf: quote.totalChf,
        stripeCheckoutSessionId: session.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err) {
    const transient = isTransientStripeError(err)
    const errType = (err as { type?: string })?.type
    const errCode = (err as { code?: string })?.code
    const errParam = (err as { param?: string })?.param
    const errStatus = (err as { statusCode?: number })?.statusCode
    const errMessage = (err as { message?: string })?.message
    console.error('[sic/checkout] stripe session failed', {
      transient,
      email,
      moduleKinds: candidate,
      type: errType,
      code: errCode,
      param: errParam,
      statusCode: errStatus,
      message: errMessage,
    })
    return NextResponse.json(
      {
        ok: false,
        code: transient ? 'stripe_transient' : 'stripe_error',
        message:
          transient ?
            'Die Zahlung startete gerade nicht — bitte gleich nochmal versuchen. Deine Angaben bleiben erhalten.'
          : 'Die Zahlung konnte nicht gestartet werden. Bitte in wenigen Minuten erneut versuchen — deine Angaben bleiben erhalten.',
        // Diagnose (nur mit ?debug=1) — hilft, Stripe-Rejects live einzuordnen,
        // ohne dass reguläre Kunden interne Details sehen.
        ...(debug ?
          {
            debug: {
              type: errType,
              code: errCode,
              param: errParam,
              statusCode: errStatus,
              message: errMessage,
              wantDescriptorSuffix,
            },
          }
        : {}),
      },
      { status: 502 }
    )
  }
}
