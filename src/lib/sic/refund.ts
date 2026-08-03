import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import type { SicModuleKind } from '@prisma/client'

/**
 * Nach Stripe-Refund: Module aus dieser Zahlung entfernen; ohne Module + Basis-Refund → REVOKED.
 * Findet SicPayment über PaymentIntent-ID oder Checkout-Session-Metadata.
 */
export async function revokeSicAfterStripeRefund(input: {
  paymentIntentId?: string | null
  checkoutSessionId?: string | null
}): Promise<{ ok: boolean; reason?: string }> {
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

  if (!payment) return { ok: false, reason: 'SIC_PAYMENT_NOT_FOUND' }

  if (payment.status === 'REFUNDED') return { ok: true, reason: 'ALREADY_REFUNDED' }

  const kinds = (payment.moduleKinds as SicModuleKind[]) ?? []
  const certificateId = payment.certificateId

  await prisma.sicPayment.update({
    where: { id: payment.id },
    data: { status: 'REFUNDED' },
  })

  if (!certificateId) return { ok: true, reason: 'NO_CERTIFICATE_YET' }

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: certificateId },
    include: { modules: true, documents: true },
  })
  if (!cert) return { ok: true, reason: 'CERTIFICATE_GONE' }

  // Dokumente der betroffenen Module löschen (Blob best-effort)
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
  // Basis refunded: includeBaseFee auf dieser Payment — wenn keine Module mehr → widerrufen
  if (remaining === 0 && payment.includeBaseFee) {
    await prisma.sicCertificate.update({
      where: { id: certificateId },
      data: { status: 'REVOKED' },
    })
  } else if (remaining === 0) {
    // Nur Module refunded, Basis blieb — Zertifikat bleibt ACTIVE aber leer (Basis-only)
  }

  return { ok: true }
}
