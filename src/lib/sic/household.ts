export type SicHouseholdKind = 'SINGLE' | 'COUPLE'

export function isSicCouple(kind: string | null | undefined): boolean {
  return kind === 'COUPLE'
}

export function parseSicHouseholdKind(raw: unknown): SicHouseholdKind {
  if (raw === 'COUPLE' || raw === true || raw === 'true') return 'COUPLE'
  return 'SINGLE'
}
