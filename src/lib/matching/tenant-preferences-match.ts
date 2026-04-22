import type { EvaluateMatchResult, SeekerMatchingInput } from '@/lib/matching/types'
import { parsePostalCodesList } from './evaluate-match'

type TenantPreferencesLike = {
  preferredCanton: string | null
  preferredPostalCodes: string | null
  preferredBudgetMin: number | null
  preferredBudgetMax: number | null
  preferredMinRooms: number | null
  preferredMaxRooms: number | null
  preferredMoveInEarliest: Date | null
  preferredMoveInLatest: Date | null
}

export function hasAnyTenantPreferences(profile: TenantPreferencesLike | null | undefined): boolean {
  if (!profile) return false
  return Boolean(
    profile.preferredCanton ||
      parsePostalCodesList(profile.preferredPostalCodes).length > 0 ||
      profile.preferredBudgetMin != null ||
      profile.preferredBudgetMax != null ||
      profile.preferredMinRooms != null ||
      profile.preferredMaxRooms != null ||
      profile.preferredMoveInEarliest != null ||
      profile.preferredMoveInLatest != null
  )
}

export function tenantPreferencesToSeekerInput(profile: TenantPreferencesLike): SeekerMatchingInput {
  return {
    cantonPreference: profile.preferredCanton ?? null,
    postalCodesWanted: profile.preferredPostalCodes ?? null,
    budgetMin: profile.preferredBudgetMin ?? null,
    budgetMax: profile.preferredBudgetMax ?? null,
    minRooms: profile.preferredMinRooms ?? null,
    maxRooms: profile.preferredMaxRooms ?? null,
    moveInEarliest: profile.preferredMoveInEarliest ?? null,
    moveInLatest: profile.preferredMoveInLatest ?? null,
    hasPets: false,
  }
}

export function matchReasonToGermanLabel(reason: EvaluateMatchResult['reasons'][number]): string {
  switch (reason.code) {
    case 'CANTON_MATCH':
      return 'Kanton passt'
    case 'BUDGET_HEADROOM':
      return 'Im Budget'
    case 'ROOMS_FIT':
      return 'Zimmerzahl passt'
    case 'PETS_ALLOWED':
      return 'Haustiere möglich'
    case 'CANTON_MISMATCH':
      return 'Kanton weicht ab'
    case 'POSTAL_CODE_NOT_IN_LIST':
      return 'PLZ nicht in Wunschliste'
    case 'BUDGET_MAX_EXCEEDED':
      return 'Budget überschritten'
    case 'BUDGET_MIN_NOT_MET':
      return 'Budget-Minimum nicht erreicht'
    case 'ROOMS_BELOW_MIN':
      return 'Zu wenige Zimmer'
    case 'ROOMS_ABOVE_MAX':
      return 'Zu viele Zimmer'
    case 'MOVE_IN_TOO_LATE':
      return 'Einzug zu spät'
    case 'MOVE_IN_TOO_EARLY':
      return 'Einzug zu früh'
    case 'PETS_NOT_ALLOWED':
      return 'Haustiere nicht erlaubt'
    default:
      return reason.detail || 'Matching-Hinweis'
  }
}
