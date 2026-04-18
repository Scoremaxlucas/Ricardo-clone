import type { MatchingConsentScope } from './consent-scopes'

/** Rohe Daten aus Prisma (serverseitig zusammengestellt), für `buildLandlordStagedSeekerView`. */
export type LandlordViewSeekerSource = {
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    nickname: string | null
    phone: string | null
  }
  searchProfile: {
    cantonPreference: string | null
    postalCodesWanted: string | null
    budgetMin: number | null
    budgetMax: number | null
    minRooms: number | null
    maxRooms: number | null
    moveInEarliest: string | null
    moveInLatest: string | null
  } | null
  household: { adults: number; children: number; petsDescription: string | null } | null
  employment: { employmentStatus: string | null; employerName: string | null } | null
  financial: { monthlyNetIncomeBand: string | null } | null
  housingHistory: { fromDate: string | null; toDate: string | null; label: string | null }[]
  documents: { kind: string; status: string; fileKey: string }[]
}

export type LandlordStagedSeekerView = {
  /** Nur Scopes, die noch nicht aktiv freigegeben sind (für Hinweistext). */
  lockedScopes: MatchingConsentScope[]
  identity: { displayName: string | null; email: string | null; phone: string | null } | null
  searchProfile: LandlordViewSeekerSource['searchProfile'] | null
  household: { adults: number; children: number } | null
  householdPets: string | null
  employment: LandlordViewSeekerSource['employment'] | null
  financial: LandlordViewSeekerSource['financial'] | null
  housingHistory: LandlordViewSeekerSource['housingHistory'] | null
  documents: { kind: string; status: string; fileKey: string }[] | null
}

export function buildLandlordStagedSeekerView(
  granted: Set<MatchingConsentScope>,
  src: LandlordViewSeekerSource
): LandlordStagedSeekerView {
  const all: MatchingConsentScope[] = [
    'seeker_identity',
    'search_profile',
    'household',
    'household_pets',
    'employment',
    'financial',
    'housing_history',
    'documents_view',
  ]
  const lockedScopes = all.filter(s => !granted.has(s))

  const identity = granted.has('seeker_identity')
    ? {
        displayName:
          [src.user.firstName, src.user.lastName].filter(Boolean).join(' ').trim() ||
          src.user.nickname ||
          null,
        email: src.user.email,
        phone: src.user.phone,
      }
    : null

  return {
    lockedScopes,
    identity,
    searchProfile: granted.has('search_profile') ? src.searchProfile : null,
    household: granted.has('household') && src.household
      ? { adults: src.household.adults, children: src.household.children }
      : null,
    householdPets: granted.has('household_pets') ? src.household?.petsDescription ?? null : null,
    employment: granted.has('employment') ? src.employment : null,
    financial: granted.has('financial') ? src.financial : null,
    housingHistory: granted.has('housing_history') ? src.housingHistory : null,
    documents: granted.has('documents_view') ? src.documents : null,
  }
}
