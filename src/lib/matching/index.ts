export type {
  EvaluateMatchResult,
  LandlordMatchingRules,
  MatchReasonKind,
  MatchReasonLine,
  PropertyMatchingInput,
  SeekerMatchingInput,
} from './types'
export { evaluateMatch, parsePostalCodesList } from './evaluate-match'
export { parseLandlordRules, petsAllowed } from './landlord-rules'
export { recomputeMatchesForProperty, recomputeMatchesForSeeker } from './persist-matches'
export { ensureLandlordAccountForUser } from './landlord-account'
export type { MatchingPropertyWizardInput } from './property-wizard-schema'
export { matchingPropertyWizardSchema } from './property-wizard-schema'
export { computeSeekerProfileCompleteness } from './seeker-profile-completeness'
export { ensureSeekerProfileForUser, loadSeekerOnboardingSnapshot } from './seeker-account'
export { MATCHING_CONSENT_SCOPES, grantedScopesFromRows, isConsentEffective } from './consent-scopes'
export { buildLandlordStagedSeekerView } from './matching-landlord-view'
export { appendMatchingAuditLog, searchMatchingAuditLogs, MATCHING_AUDIT_ENTITY_TYPES } from './matching-audit-log'
export { requireMatchingAdmin } from './matching-ops-auth'
