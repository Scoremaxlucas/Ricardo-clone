import { decodePaymentHolderName } from '@/lib/sic/dossier'
import { resolveSicCheckoutModuleIds, type SicModuleId } from '@/lib/sic/modules'
import { normalizeEmail } from '@/lib/sic/session'

export type SicCheckoutRetry = {
  email: string
  moduleIds: SicModuleId[]
  firstName: string
  lastName: string
  firstName2: string
  lastName2: string
  householdKind: 'SINGLE' | 'COUPLE'
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
  includeBaseFee?: boolean
  status: string
}): SicCheckoutRetry | null {
  if (input.status === 'PAID' || input.status === 'REFUNDED') return null
  const names = decodePaymentHolderName(input.holderName)
  const couple = !!(names?.firstName2 && names?.lastName2)
  return {
    email: normalizeEmail(input.email),
    moduleIds: resolveSicCheckoutModuleIds({
      includeBaseFee: input.includeBaseFee === true,
      isRenewal: input.isRenewal,
      requested: input.moduleKinds,
    }),
    firstName: names?.firstName ?? '',
    lastName: names?.lastName ?? '',
    firstName2: names?.firstName2 ?? '',
    lastName2: names?.lastName2 ?? '',
    householdKind: couple ? 'COUPLE' : 'SINGLE',
    renewal: input.isRenewal,
  }
}

export function canResumeSicCheckout(retry: SicCheckoutRetry): boolean {
  if (retry.renewal) return true
  if (!retry.firstName || !retry.lastName) return false
  if (retry.householdKind === 'COUPLE') return Boolean(retry.firstName2 && retry.lastName2)
  return true
}

export function newSicCheckoutAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `sic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function sicCheckoutRetryRequestBody(retry: SicCheckoutRetry): Record<string, unknown> & {
  attemptId: string
} {
  const attemptId = newSicCheckoutAttemptId()
  if (retry.renewal) {
    return { email: retry.email, moduleIds: retry.moduleIds, renewal: true as const, attemptId }
  }
  return {
    email: retry.email,
    moduleIds: retry.moduleIds,
    firstName: retry.firstName,
    lastName: retry.lastName,
    attemptId,
    ...(retry.householdKind === 'COUPLE' ?
      {
        householdKind: 'COUPLE' as const,
        firstName2: retry.firstName2,
        lastName2: retry.lastName2,
      }
    : {}),
  }
}
