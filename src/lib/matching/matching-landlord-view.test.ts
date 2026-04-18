import { describe, expect, it } from 'vitest'
import type { MatchingConsentScope } from './consent-scopes'
import { buildLandlordStagedSeekerView, type LandlordViewSeekerSource } from './matching-landlord-view'

const baseSrc = (): LandlordViewSeekerSource => ({
  user: {
    email: 'a@b.ch',
    firstName: 'Alex',
    lastName: 'Muster',
    nickname: null,
    phone: '+41 79 000 00 00',
  },
  searchProfile: {
    cantonPreference: 'ZH',
    postalCodesWanted: null,
    budgetMin: 2000,
    budgetMax: 3500,
    minRooms: 3,
    maxRooms: 4.5,
    moveInEarliest: null,
    moveInLatest: null,
  },
  household: { adults: 2, children: 1, petsDescription: 'Katze' },
  employment: { employmentStatus: 'Angestellt', employerName: 'ACME' },
  financial: { monthlyNetIncomeBand: '5000–8000 CHF' },
  housingHistory: [],
  documents: [{ kind: 'id_proof', status: 'verified', fileKey: 'https://example.com/x' }],
})

describe('buildLandlordStagedSeekerView', () => {
  it('hides all sensitive blocks when nothing granted', () => {
    const granted = new Set<MatchingConsentScope>()
    const v = buildLandlordStagedSeekerView(granted, baseSrc())
    expect(v.identity).toBeNull()
    expect(v.searchProfile).toBeNull()
    expect(v.household).toBeNull()
    expect(v.documents).toBeNull()
    expect(v.lockedScopes.length).toBeGreaterThan(0)
  })

  it('shows identity and documents when granted', () => {
    const granted = new Set<MatchingConsentScope>(['seeker_identity', 'documents_view'])
    const v = buildLandlordStagedSeekerView(granted, baseSrc())
    expect(v.identity?.email).toBe('a@b.ch')
    expect(v.documents?.[0]?.fileKey).toContain('https://')
  })
})
