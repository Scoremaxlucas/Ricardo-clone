import { prisma } from '@/lib/prisma'
import { sicLog } from '@/lib/sic/log'
import { isFullStripeRefund } from '@/lib/sic/refund-gate'
import { del } from '@vercel/blob'
import type { SicModuleKind } from '@prisma/client'

/**
 * Nach vollständigem Stripe-Refund: Module aus dieser Zahlung entfernen;
 * ohne Module + Basis-Refund → REVOKED.
 */
export async function revokeSicAfterStripeRefund(input: {
  paymentIntentId?: string | null
  checkoutSessionId?: string | null
  /** Stripe Charge amount / amount_refunded — Partial → skip */
  chargeAmount?: number | null
  chargeAmountRefunded?: number | null
  /** Dispute funds withdrawn = Full-Loss */
  forceFull?: boolean
}): Promise<{ ok: boolean; reason?: string }> {
  if (
    !input.forceFull &&
    input.chargeAmount != null &&
    input.chargeAmountRefunded != null &&
    !isFullStripeRefund(input.chargeAmount, input.chargeAmountRefunded)
  ) {
    sicLog('sic.refund.skipped_partial', {
      paymentIntentId: input.paymentIntentId ?? null,
      amount: input.chargeAmount,
      amountRefunded: input.chargeAmountRefunded,
    })
    return { ok: true, reason: 'PARTIAL_REFUND_SKIPPED' }
  }

  let payment =
    input.paymentIntentId ?
      await prisma.sicPayment.findFirst({
        where: { stripePaymentIntentId: input.paymentIntentId },
      })
    : null

  if (!payment && input.checkoutSessionId) {
    payment = await prisma.sicPayment.findUnique({
      where: { stripeCheckoutSessionId: input.checkoutSessionId },
    })
  }

  if (!payment) {
    sicLog('sic.refund.payment_not_found', {
      paymentIntentId: input.paymentIntentId ?? null,
    })
    return { ok: false, reason: 'SIC_PAYMENT_NOT_FOUND' }
  }

  if (payment.status === 'REFUNDED') return { ok: true, reason: 'ALREADY_REFUNDED' }

  const kinds = (payment.moduleKinds as SicModuleKind[]) ?? []
  const certificateId = payment.certificateId

  await prisma.sicPayment.update({
    where: { id: payment.id },
    data: { status: 'REFUNDED' },
  })

  if (!certificateId) {
    sicLog('sic.refund.revoked', { paymentId: payment.id, reason: 'NO_CERTIFICATE_YET' })
    return { ok: true, reason: 'NO_CERTIFICATE_YET' }
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: certificateId },
    include: { modules: true, documents: true },
  })
  if (!cert) {
    sicLog('sic.refund.revoked', { paymentId: payment.id, reason: 'CERTIFICATE_GONE' })
    return { ok: true, reason: 'CERTIFICATE_GONE' }
  }

  const docsToDelete = cert.documents.filter(d => kinds.includes(d.moduleKind as SicModuleKind))
  for (const doc of docsToDelete) {
    try {
      await del(doc.blobUrl)
    } catch {
      // Alt-URL oder schon weg
    }
  }
  if (docsToDelete.length > 0) {
    await prisma.sicDocument.deleteMany({
      where: { id: { in: docsToDelete.map(d => d.id) } },
    })
  }

  if (kinds.length > 0) {
    await prisma.sicCertificateModule.deleteMany({
      where: { certificateId, moduleKind: { in: kinds } },
    })
  }

  const remaining = await prisma.sicCertificateModule.count({ where: { certificateId } })
  if (remaining === 0 && payment.includeBaseFee) {
    await prisma.sicCertificate.update({
      where: { id: certificateId },
      data: { status: 'REVOKED' },
    })
  }

  sicLog('sic.refund.revoked', {
    paymentId: payment.id,
    certificateId,
    modulesRemoved: kinds.length,
    revokedCert: remaining === 0 && payment.includeBaseFee,
  })

  return { ok: true }
}
