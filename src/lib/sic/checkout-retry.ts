import { decodePaymentHolderName } from '@/lib/sic/dossier'
import { normalizeSicModuleIds, type SicModuleId } from '@/lib/sic/modules'
import { normalizeEmail } from '@/lib/sic/session'

export type SicCheckoutRetry = {
  email: string
  moduleIds: SicModuleId[]
  firstName: string
  lastName: string
  renewal: boolean
}

/**
 * Baut aus einer gespeicherten Zahlung den Payload, mit dem Checkout neu
 * gestartet werden kann. Bezahlte oder erstattete Sessions sind kein Retry.
 */
export function sicCheckoutRetryFromPayment(input: {
  email: string
  moduleKinds: unknown
  holderName?: string | null
  isRenewal: boolean
  status: string
}): SicCheckoutRetry | null {
  if (input.status === 'PAID' || input.status === 'REFUNDED') return null
  const names = decodePaymentHolderName(input.holderName)
  return {
    email: normalizeEmail(input.email),
    moduleIds: normalizeSicModuleIds(input.moduleKinds),
    firstName: names?.firstName ?? '',
    lastName: names?.lastName ?? '',
    renewal: input.isRenewal,
  }
}

export function canResumeSicCheckout(retry: SicCheckoutRetry): boolean {
  if (retry.renewal) return true
  return Boolean(retry.firstName && retry.lastName)
}

export function sicCheckoutRetryRequestBody(retry: SicCheckoutRetry) {
  if (retry.renewal) {
    return { email: retry.email, moduleIds: retry.moduleIds, renewal: true as const }
  }
  return {
    email: retry.email,
    moduleIds: retry.moduleIds,
    firstName: retry.firstName,
    lastName: retry.lastName,
  }
}
