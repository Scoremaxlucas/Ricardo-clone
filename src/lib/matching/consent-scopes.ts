/**
 * Freigabe-Scopes für Matching-Bewerbungen (ConsentShare.scope).
 * Nur explizit freigegebene Daten werden dem Vermieter in der Detailansicht gezeigt.
 */
export const MATCHING_CONSENT_SCOPES = [
  'seeker_identity',
  'search_profile',
  'household',
  'household_pets',
  'employment',
  'financial',
  'housing_history',
  'documents_view',
] as const

export type MatchingConsentScope = (typeof MATCHING_CONSENT_SCOPES)[number]

export function isMatchingConsentScope(s: string): s is MatchingConsentScope {
  return (MATCHING_CONSENT_SCOPES as readonly string[]).includes(s)
}

export type ConsentRow = {
  scope: string
  grantedAt: string | Date | null
  revokedAt: string | Date | null
}

function nonEmpty(v: unknown): boolean {
  if (v == null) return false
  if (v instanceof Date) return !Number.isNaN(v.getTime())
  if (typeof v === 'string') return v.length > 0
  return false
}

export function isConsentEffective(row: ConsentRow): boolean {
  return nonEmpty(row.grantedAt) && !nonEmpty(row.revokedAt)
}

export function grantedScopesFromRows(rows: ConsentRow[]): Set<MatchingConsentScope> {
  const out = new Set<MatchingConsentScope>()
  for (const r of rows) {
    if (!isMatchingConsentScope(r.scope)) continue
    if (isConsentEffective(r)) out.add(r.scope)
  }
  return out
}
