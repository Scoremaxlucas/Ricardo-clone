import { prisma } from '@/lib/prisma'
import { sicLog } from '@/lib/sic/log'
import { isSicModuleId } from '@/lib/sic/modules'
import { sicChfToStripeCents, sicModuleRefundAmountChf } from '@/lib/sic/module-refund-amount'
import { isFullStripeRefund } from '@/lib/sic/refund-gate'
import { stripe } from '@/lib/stripe-server'
import { del } from '@vercel/blob'
import type { SicModuleKind } from '@prisma/client'

export type RefundSicModuleResult =
  | { ok: true; already: boolean; amountChf: number }
  | {
      ok: false
      code: 'NOT_FOUND' | 'NOT_ELIGIBLE' | 'NO_PAYMENT' | 'STRIPE'
      message: string
    }

/**
 * AGB §7: Angabe erstatten, die wir aus Gründen bei uns nicht prüfen können.
 * Stripe-Teilrefund, Modul entfernen, Zertifikat bleibt (Teilzertifikat).
 */
export async function refundSicPaidModule(opts: {
  certificateId: string
  moduleKind: string
  reviewerId: string
}): Promise<RefundSicModuleResult> {
  if (!isSicModuleId(opts.moduleKind)) {
    return { ok: false, code: 'NOT_FOUND', message: 'Angabe nicht gefunden.' }
  }
  const moduleKind = opts.moduleKind as SicModuleKind

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: opts.certificateId },
    include: {
      modules: { where: { moduleKind } },
      documents: { where: { moduleKind } },
    },
  })
  if (!cert) return { ok: false, code: 'NOT_FOUND', message: 'Zertifikat nicht gefunden.' }
  if (cert.status === 'REVOKED') {
    return { ok: false, code: 'NOT_ELIGIBLE', message: 'Widerrufene Zertifikate werden nicht erstattet.' }
  }

  const mod = cert.modules[0]
  if (!mod) {
    return { ok: true, already: true, amountChf: 0 }
  }
  if (mod.status !== 'IN_REVIEW' || cert.documents.length === 0) {
    return {
      ok: false,
      code: 'NOT_ELIGIBLE',
      message:
        'Erstattung nur, wenn die Unterlagen vorliegen und wir die Angabe noch nicht geprüft haben (AGB §7).',
    }
  }

  const payment = await prisma.sicPayment.findFirst({
    where: {
      certificateId: cert.id,
      status: 'PAID',
      isRenewal: false,
      moduleKinds: { has: moduleKind },
      stripePaymentIntentId: { not: null },
    },
    orderBy: { paidAt: 'desc' },
  })
  if (!payment?.stripePaymentIntentId) {
    return { ok: false, code: 'NO_PAYMENT', message: 'Keine passende Zahlung für diese Angabe.' }
  }

  const stripeState = await stripeRefundProgress(payment.stripePaymentIntentId)
  if (!stripeState) {
    return { ok: false, code: 'STRIPE', message: 'Stripe-Zahlung konnte nicht gelesen werden.' }
  }

  const amountChf = sicModuleRefundAmountChf({
    amountPaidChf: Number(payment.amountChf),
    includeBaseFee: payment.includeBaseFee,
    isRenewal: payment.isRenewal,
    moduleKinds: payment.moduleKinds,
    moduleKind,
    alreadyRefundedChf: stripeState.refundedChf,
  })
  if (amountChf == null) {
    return { ok: false, code: 'NO_PAYMENT', message: 'Für diese Angabe ist kein erstattbarer Betrag übrig.' }
  }

  const amountCents = sicChfToStripeCents(amountChf)
  try {
    await stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: amountCents,
        reason: 'requested_by_customer',
        metadata: {
          sic_agb: '7',
          sic_certificate_id: cert.id,
          sic_module: moduleKind,
          sic_reviewer: opts.reviewerId,
        },
      },
      { idempotencyKey: `sic-mod-refund:${cert.id}:${moduleKind}` }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe-Erstattung fehlgeschlagen.'
    sicLog('sic.admin.module_refund.stripe_failed', {
      certificateId: cert.id,
      moduleKind,
      message,
    })
    return { ok: false, code: 'STRIPE', message: 'Stripe-Erstattung fehlgeschlagen.' }
  }

  for (const doc of cert.documents) {
    try {
      await del(doc.blobUrl)
    } catch {
      // Alt-URL oder schon weg
    }
  }
  if (cert.documents.length > 0) {
    await prisma.sicDocument.deleteMany({
      where: { id: { in: cert.documents.map(d => d.id) } },
    })
  }
  await prisma.sicCertificateModule.delete({ where: { id: mod.id } })

  const after = await stripeRefundProgress(payment.stripePaymentIntentId)
  if (after && isFullStripeRefund(after.amountCents, after.refundedCents)) {
    await prisma.sicPayment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    })
  }

  sicLog('sic.admin.module_refund', {
    certificateId: cert.id,
    moduleKind,
    paymentId: payment.id,
    amountChf,
    reviewerId: opts.reviewerId,
  })

  return { ok: true, already: false, amountChf }
}

async function stripeRefundProgress(
  paymentIntentId: string
): Promise<{ refundedChf: number; amountCents: number; refundedCents: number } | null> {
  try {
    const charges = await stripe.charges.list({ payment_intent: paymentIntentId, limit: 1 })
    const charge = charges.data[0]
    if (!charge) return null
    return {
      amountCents: charge.amount,
      refundedCents: charge.amount_refunded,
      refundedChf: charge.amount_refunded / 100,
    }
  } catch {
    return null
  }
}
