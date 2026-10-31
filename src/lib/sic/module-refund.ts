import { prisma } from '@/lib/prisma'
import { sicLog } from '@/lib/sic/log'
import { isSicModuleId } from '@/lib/sic/modules'
import { sicChfToStripeCents, sicModuleRefundAmountChf } from '@/lib/sic/module-refund-amount'
import { refundSicPayment, sicPaymentRefundProgress } from '@/lib/sic/payment-refund'
import { isFullStripeRefund } from '@/lib/sic/refund-gate'
import { deleteSicBlob } from '@/lib/sic/blob-delete'
import { sendSicRefundEmail } from '@/lib/sic/email'
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

  const progress = await sicPaymentRefundProgress(payment)
  if (!progress) {
    return { ok: false, code: 'STRIPE', message: 'Die Zahlung konnte beim Zahlungsanbieter nicht gelesen werden.' }
  }

  const amountChf = sicModuleRefundAmountChf({
    amountPaidChf: Number(payment.amountChf),
    includeBaseFee: payment.includeBaseFee,
    isRenewal: payment.isRenewal,
    moduleKinds: payment.moduleKinds,
    moduleKind,
    alreadyRefundedChf: progress.refundedCents / 100,
  })
  if (amountChf == null) {
    return { ok: false, code: 'NO_PAYMENT', message: 'Für diese Angabe ist kein erstattbarer Betrag übrig.' }
  }

  // Erst die Angabe beanspruchen (bedingt löschen), dann erstatten: ein Doppelklick
  // erstattet so nur einmal — auch bei Payrexx, das keinen Idempotency-Key kennt.
  const claimed = await prisma.sicCertificateModule.deleteMany({ where: { id: mod.id, status: 'IN_REVIEW' } })
  if (claimed.count === 0) {
    return { ok: true, already: true, amountChf: 0 }
  }

  const refunded = await refundSicPayment(payment, {
    amountCents: sicChfToStripeCents(amountChf),
    idempotencyKey: `sic-mod-refund:${payment.id}:${moduleKind}`,
    metadata: {
      sic_agb: '7',
      sic_certificate_id: cert.id,
      sic_module: moduleKind,
      sic_reviewer: opts.reviewerId,
    },
  })
  if (!refunded) {
    // Angabe zurückgeben, damit sie weiter geprüft oder erneut erstattet werden kann.
    await prisma.sicCertificateModule.create({
      data: {
        id: mod.id,
        certificateId: cert.id,
        moduleKind,
        status: mod.status,
        paidAt: mod.paidAt,
        verifiedFacts: mod.verifiedFacts ?? undefined,
        uploadReminderSentAt: mod.uploadReminderSentAt,
      },
    })
    sicLog('sic.admin.module_refund.provider_failed', { certificateId: cert.id, moduleKind })
    return { ok: false, code: 'STRIPE', message: 'Erstattung beim Zahlungsanbieter fehlgeschlagen.' }
  }

  for (const doc of cert.documents) {
    await deleteSicBlob(doc.blobUrl)
  }
  if (cert.documents.length > 0) {
    await prisma.sicDocument.deleteMany({
      where: { id: { in: cert.documents.map(d => d.id) } },
    })
  }

  const after = await sicPaymentRefundProgress(payment)
  if (after && isFullStripeRefund(after.amountCents, after.refundedCents)) {
    await prisma.sicPayment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    })
  }

  try {
    await sendSicRefundEmail({ email: cert.email, amountChf, moduleKinds: [moduleKind] })
  } catch (err) {
    console.error('[sic/module-refund] refund email', err)
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
