import {
  isPayrexxSessionId,
  payrexxConfirmedTransaction,
  refundPayrexxTransaction,
} from '@/lib/sic/payrexx'
import { sicLog } from '@/lib/sic/log'
import { stripe } from '@/lib/stripe-server'

/**
 * Erstattungen laufen über den Anbieter, über den bezahlt wurde: Stripe (Karte,
 * Link) oder Payrexx (TWINT). Payrexx-Zahlungen erkennt man an der Session-ID.
 */
export type SicRefundablePayment = {
  id: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId: string | null
  paidAt: Date | null
  createdAt: Date
}

export function isSicPayrexxPayment(
  payment: Pick<SicRefundablePayment, 'stripeCheckoutSessionId'>
): boolean {
  return isPayrexxSessionId(payment.stripeCheckoutSessionId)
}

/** Bezahlter und bereits erstatteter Betrag in Rappen. Null, wenn der Anbieter nichts liefert. */
export async function sicPaymentRefundProgress(
  payment: SicRefundablePayment
): Promise<{ amountCents: number; refundedCents: number } | null> {
  try {
    if (isSicPayrexxPayment(payment)) {
      const tx = await payrexxConfirmedTransaction(
        payment.stripeCheckoutSessionId,
        payment.paidAt ?? payment.createdAt
      )
      return tx ? { amountCents: tx.amountCents, refundedCents: tx.refundedCents } : null
    }
    if (!payment.stripePaymentIntentId) return null
    const charges = await stripe.charges.list({
      payment_intent: payment.stripePaymentIntentId,
      limit: 1,
    })
    const charge = charges.data[0]
    if (!charge) return null
    return { amountCents: charge.amount, refundedCents: charge.amount_refunded }
  } catch {
    return null
  }
}

/**
 * Erstattet eine Zahlung ganz oder teilweise. Ohne Betrag: der ganze noch offene Rest.
 * Gibt false zurück, wenn der Anbieter ablehnt — der Aufrufer entscheidet, was dann gilt.
 */
export async function refundSicPayment(
  payment: SicRefundablePayment,
  opts: { amountCents?: number; idempotencyKey: string; metadata?: Record<string, string> }
): Promise<boolean> {
  try {
    if (isSicPayrexxPayment(payment)) {
      const tx = await payrexxConfirmedTransaction(
        payment.stripeCheckoutSessionId,
        payment.paidAt ?? payment.createdAt
      )
      if (!tx) throw new Error('Payrexx-Transaktion nicht gefunden')
      const amount = opts.amountCents ?? tx.amountCents - tx.refundedCents
      if (amount <= 0) return true
      await refundPayrexxTransaction(tx.id, amount)
      return true
    }
    if (!payment.stripePaymentIntentId) throw new Error('Keine Stripe-Zahlung hinterlegt')
    await stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        ...(opts.amountCents != null ? { amount: opts.amountCents } : {}),
        ...(opts.metadata ? { metadata: opts.metadata } : {}),
      },
      { idempotencyKey: opts.idempotencyKey }
    )
    return true
  } catch (err) {
    sicLog('sic.refund.provider_failed', {
      paymentId: payment.id,
      provider: isSicPayrexxPayment(payment) ? 'payrexx' : 'stripe',
      message: err instanceof Error ? err.message : 'unknown',
    })
    return false
  }
}
