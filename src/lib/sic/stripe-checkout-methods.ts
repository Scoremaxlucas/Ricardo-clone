/**
 * SIC-Checkout bei Stripe: welche Methoden wir anbieten, solange TWINT
 * im Dashboard Ineligible ist.
 *
 * `card` zieht auf Stripe Checkout auch Apple Pay / Google Pay nach, sobald
 * die Domain verifiziert ist. `link` ist Stripe Link. TWINT kommt bewusst
 * nicht in die Liste — sonst scheitert die ganze Session.
 */
export const SIC_CHECKOUT_PAYMENT_METHODS = ['card', 'link'] as const

export type SicCheckoutPaymentMethod = (typeof SIC_CHECKOUT_PAYMENT_METHODS)[number]

/** Stripe lehnt eine explizit gesetzte Methode ab (nicht aktiviert / Ineligible). */
export function stripeRejectedPaymentMethod(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null
  const anyErr = err as { param?: string; message?: string }
  const param = typeof anyErr.param === 'string' ? anyErr.param : ''
  const message = typeof anyErr.message === 'string' ? anyErr.message : ''
  if (!param.includes('payment_method') && !/payment method type provided/i.test(message)) {
    return null
  }
  const match = message.match(/provided:\s*([a-z0-9_]+)/i)
  return match?.[1]?.toLowerCase() ?? null
}

/**
 * Entfernt die abgelehnte Methode. `card` bleibt immer — ohne Karte gibt es
 * keinen Checkout. Leere Liste gibt es nicht.
 */
export function sicCheckoutMethodsWithout(
  current: readonly string[],
  rejected: string
): string[] {
  const next = current.filter(m => m !== rejected)
  if (next.includes('card')) return next
  if (current.includes('card')) return ['card']
  return next.length > 0 ? next : ['card']
}
