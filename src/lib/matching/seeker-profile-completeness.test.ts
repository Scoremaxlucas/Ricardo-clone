import { describe, expect, it } from 'vitest'
import type { SeekerOnboardingSnapshot } from './seeker-account'
import { computeSeekerProfileCompleteness } from './seeker-profile-completeness'

const emptySnapshot = (): SeekerOnboardingSnapshot => ({
  seekerProfileId: 'p1',
  profileUpdatedAt: new Date().toISOString(),
  searchProfile: null,
  household: null,
  employment: null,
  financial: null,
  documents: [],
})

describe('computeSeekerProfileCompleteness', () => {
  it('returns 0 when nothing filled', () => {
    const r = computeSeekerProfileCompleteness(emptySnapshot())
    expect(r.totalPercent).toBe(0)
    expect(r.sections.every(s => !s.done)).toBe(true)
  })

  it('marks search done when required fields present', () => {
    const s = emptySnapshot()
    s.searchProfile = {
      cantonPreference: 'ZH',
      postalCodesWanted: null,
      budgetMin: 1000,
      budgetMax: 3000,
      minRooms: 3,
      maxRooms: 4.5,
      moveInEarliest: null,
      moveInLatest: null,
    }
    s.household = { adults: 2, children: 0, petsDescription: null }
    const r = computeSeekerProfileCompleteness(s)
    const search = r.sections.find(x => x.id === 'search')
    const hh = r.sections.find(x => x.id === 'household')
    expect(search?.done).toBe(true)
    expect(hh?.done).toBe(true)
    expect(r.totalPercent).toBeGreaterThan(0)
  })
})
