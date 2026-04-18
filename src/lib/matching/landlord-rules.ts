import type { LandlordMatchingRules } from './types'

/** Parst `rulesJson` aus MatchingProperty — defensiv, nie throw */
export function parseLandlordRules(raw: unknown): LandlordMatchingRules {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  const o = raw as Record<string, unknown>
  const allowPets = o.allowPets
  return {
    allowPets: typeof allowPets === 'boolean' ? allowPets : undefined,
  }
}

export function petsAllowed(rules: LandlordMatchingRules): boolean {
  return rules.allowPets !== false
}
