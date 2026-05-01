import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'

/** Two-letter Swiss canton codes (incl. half-cantons). */
const SWISS_CANTON = new Set([
  'ZH',
  'BE',
  'LU',
  'UR',
  'SZ',
  'OW',
  'NW',
  'GL',
  'ZG',
  'FR',
  'SO',
  'BS',
  'BL',
  'SH',
  'AR',
  'AI',
  'SG',
  'GR',
  'AG',
  'TG',
  'TI',
  'VD',
  'VS',
  'NE',
  'GE',
  'JU',
])

function normalizeCanton(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

function isSwissCantonAbbreviation(c: string): boolean {
  return c.length === 2 && SWISS_CANTON.has(c)
}

/**
 * Prefer the snapshot canton when it is a real canton code.
 * If the DB has the generic fallback "CH" (or empty), use `canton` from the current TenantProfile creditCheckResult JSON.
 */
export function resolveCantonForPdf(storedCanton: string, creditCheckResultJson: unknown): string {
  const stored = normalizeCanton(storedCanton)
  if (isSwissCantonAbbreviation(stored)) return stored
  if (stored && stored !== 'CH' && stored.length >= 2 && stored.length <= 4) return stored.slice(0, 4)

  const parsed: CreditCheckResult | null = isCreditCheckResult(creditCheckResultJson) ? creditCheckResultJson : null
  const fromJson = normalizeCanton(parsed?.canton ?? '')
  if (isSwissCantonAbbreviation(fromJson)) return fromJson
  if (fromJson && fromJson !== 'CH') return fromJson.slice(0, 4)

  if (stored && stored !== 'CH') return stored
  return '—'
}
