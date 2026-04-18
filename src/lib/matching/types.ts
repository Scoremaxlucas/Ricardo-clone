/**
 * Plain inputs for rule-based matching (no Prisma types — testable & portable).
 */

export type MatchReasonKind = 'hard' | 'soft'

export type MatchReasonLine = {
  kind: MatchReasonKind
  code: string
  detail?: string
}

export type SeekerMatchingInput = {
  cantonPreference: string | null
  /** Komma-getrennte PLZ, z. B. "8001,8004" */
  postalCodesWanted: string | null
  budgetMin: number | null
  budgetMax: number | null
  minRooms: number | null
  maxRooms: number | null
  moveInEarliest: Date | null
  moveInLatest: Date | null
  /** Aus HouseholdProfile.petsDescription abgeleitet */
  hasPets: boolean
}

export type PropertyMatchingInput = {
  id: string
  canton: string
  zip: string
  rooms: number
  rentPerMonth: number
  availableFrom: Date | null
  /** Nur `active` liefert in der Regel Treffer; andere Status können hart ausfallen */
  status: 'draft' | 'active' | 'paused' | 'archived'
}

/** Aus `MatchingProperty.rulesJson` — erweiterbar in späteren Phasen */
export type LandlordMatchingRules = {
  /** Default true wenn Feld fehlt */
  allowPets?: boolean
}

export type EvaluateMatchResult = {
  score: number
  hardFailed: boolean
  reasons: MatchReasonLine[]
}
