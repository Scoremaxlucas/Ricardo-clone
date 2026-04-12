/** JSON-Struktur aus Claude (Betreibungsregisterauszug) */
export type CreditCheckResult = {
  isValid: boolean
  issueDate: string
  isRecent: boolean
  hasEntries: boolean
  entryCount: number
  totalAmountCategory: 'none' | 'low' | 'medium' | 'high'
  fullName: string
  canton: string
}

export function isCreditCheckResult(x: unknown): x is CreditCheckResult {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.isValid === 'boolean' &&
    typeof o.issueDate === 'string' &&
    typeof o.isRecent === 'boolean' &&
    typeof o.hasEntries === 'boolean' &&
    typeof o.entryCount === 'number' &&
    typeof o.totalAmountCategory === 'string' &&
    ['none', 'low', 'medium', 'high'].includes(o.totalAmountCategory as string) &&
    typeof o.fullName === 'string' &&
    typeof o.canton === 'string'
  )
}
