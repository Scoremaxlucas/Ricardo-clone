import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { generateSicCertificateCode } from '@/lib/sic/certificate-code'
import { sendSicMagicLinkEmail } from '@/lib/sic/email'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { sicExtendedExpiresAt, sicValidityExpiresAt } from '@/lib/sic/validity'
import type { SicModuleKind } from '@prisma/client'

export type FulfillResult =
  | { ok: true; certificateId: string; certificateCode: string; email: string; alreadyDone: boolean; refundedDuplicate?: boolean }
  | { ok: false; reason: string }

/** Zerlegt einen frei eingegebenen Namen in Vor-/Nachname (erstes Token = Vorname, Rest = Nachname). */
function splitHolderName(raw?: string | null): { firstName: string; lastName: string } | null {
  const cleaned = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return null
  const parts = cleaned.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function ensureUniqueCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = generateSicCertificateCode()
    const exists = await prisma.sicCertificate.findUnique({
      where: { certificateCode: code },
      select: { id: true },
    })
    if (!exists) return code
  }
  throw new Error('Konnte keinen eindeutigen Zertifikatscode erzeugen')
}

async function refundPaymentIntent(paymentIntentId: string | null | undefined): Promise<boolean> {
  if (!paymentIntentId) return false
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId })
    return true
  } catch (err) {
    console.error('[sic/fulfillment] refund failed', err)
    return false
  }
}

/**
 * Wendet eine bezahlte Checkout-Session auf das Dossier an (idempotent).
 * Findet/erstellt das Zertifikat per E-Mail, fügt bezahlte Module hinzu (PENDING_DOCS),
 * verlängert die Gültigkeit und schickt einen Magic-Link zum Upload.
 */
export async function fulfillSicPaidCheckout(input: {
  stripeCheckoutSessionId: string
  stripePaymentIntentId?: string | null
}): Promise<FulfillResult> {
  const payment = await prisma.sicPayment.findUnique({
    where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
  })
  if (!payment) return { ok: false, reason: 'PAYMENT_NOT_FOUND' }

  if (payment.status === 'PAID' && payment.certificateId) {
    const cert = await prisma.sicCertificate.findUnique({
      where: { id: payment.certificateId },
      select: { certificateCode: true },
    })
    return {
      ok: true,
      certificateId: payment.certificateId,
      certificateCode: cert?.certificateCode ?? '',
      email: payment.email,
      alreadyDone: true,
    }
  }

  if (payment.status === 'REFUNDED') {
    return { ok: false, reason: 'PAYMENT_REFUNDED' }
  }

  const now = new Date()
  const email = payment.email
  const moduleKinds = (payment.moduleKinds as SicModuleKind[]) ?? []
  const pi =
    input.stripePaymentIntentId ?? payment.stripePaymentIntentId

  // Race: Zertifikat erneut laden — Module die schon existieren, nicht nochmals «verkaufen».
  let existing = await prisma.sicCertificate.findUnique({
    where: { email },
    include: { modules: { select: { moduleKind: true } } },
  })
  const alreadyOwned = new Set((existing?.modules ?? []).map(m => m.moduleKind))
  const newKinds = moduleKinds.filter(k => !alreadyOwned.has(k))

  // Doppelzahlung: nichts Neues zu erfüllen → Stripe full refund (nur REFUNDED wenn Refund OK)
  if (existing && newKinds.length === 0) {
    const refunded = await refundPaymentIntent(pi)
    if (refunded) {
      await prisma.sicPayment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          paidAt: now,
          certificateId: existing.id,
          stripePaymentIntentId: pi,
        },
      })
      sicLog('sic.fulfillment.duplicate_refunded', {
        paymentId: payment.id,
        certificateId: existing.id,
      })
      return {
        ok: true,
        certificateId: existing.id,
        certificateCode: existing.certificateCode,
        email,
        alreadyDone: true,
        refundedDuplicate: true,
      }
    }
    // Refund fehlgeschlagen: als PAID verknüpfen ohne zweite Module; Ops sieht Log
    await prisma.sicPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: now,
        certificateId: existing.id,
        stripePaymentIntentId: pi,
      },
    })
    sicLog('sic.fulfillment.refund_failed', {
      paymentId: payment.id,
      certificateId: existing.id,
      paymentIntentId: pi ?? null,
    })
    return {
      ok: true,
      certificateId: existing.id,
      certificateCode: existing.certificateCode,
      email,
      alreadyDone: true,
      refundedDuplicate: false,
    }
  }

  const code = existing ? existing.certificateCode : await ensureUniqueCode()
  const prefillName = splitHolderName(payment.holderName)

  let cert
  try {
    cert = await prisma.$transaction(async tx => {
      const c =
        existing ?
          await tx.sicCertificate.update({
            where: { id: existing!.id },
            data: {
              status: 'ACTIVE',
              expiresAt: sicExtendedExpiresAt(existing!.expiresAt, now),
              ...(prefillName && !existing!.holderFirstName && !existing!.holderLastName ?
                { holderFirstName: prefillName.firstName, holderLastName: prefillName.lastName || null }
              : {}),
            },
          })
        : await tx.sicCertificate.create({
            data: {
              email,
              certificateCode: code,
              status: 'ACTIVE',
              issuedAt: now,
              expiresAt: sicValidityExpiresAt(now),
              ...(prefillName ?
                { holderFirstName: prefillName.firstName, holderLastName: prefillName.lastName || null }
              : {}),
            },
          })

      for (const kind of newKinds) {
        await tx.sicCertificateModule.upsert({
          where: { certificateId_moduleKind: { certificateId: c.id, moduleKind: kind } },
          create: { certificateId: c.id, moduleKind: kind, status: 'PENDING_DOCS', paidAt: now },
          update: {},
        })
      }

      await tx.sicPayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: now,
          certificateId: c.id,
          stripePaymentIntentId: pi,
        },
      })

      return c
    })
  } catch (err: unknown) {
    // Unique email race: zweiter paralleler Erstkauf — nachgeladen fortsetzen (max. 1 Retry-Semantik via PAID-Check oben)
    const again = await prisma.sicCertificate.findUnique({
      where: { email },
      include: { modules: { select: { moduleKind: true } } },
    })
    if (!again) throw err
    // Payment kann zwischenzeitlich von anderem Worker auf PAID gesetzt worden sein
    const refreshed = await prisma.sicPayment.findUnique({
      where: { id: payment.id },
    })
    if (refreshed?.status === 'PAID' || refreshed?.status === 'REFUNDED') {
      return fulfillSicPaidCheckout(input)
    }
    existing = again
    return fulfillSicPaidCheckout(input)
  }

  try {
    const { url } = await createSicMagicLink(email)
    await sendSicMagicLinkEmail(email, url)
  } catch (err) {
    console.error('[sic/fulfillment] magic link email failed', err)
  }

  return { ok: true, certificateId: cert.id, certificateCode: cert.certificateCode, email, alreadyDone: false }
}
