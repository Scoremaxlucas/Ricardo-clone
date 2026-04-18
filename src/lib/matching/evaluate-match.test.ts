// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { evaluateMatch, parsePostalCodesList } from './evaluate-match'
import type { LandlordMatchingRules, PropertyMatchingInput, SeekerMatchingInput } from './types'

const baseProperty = (): PropertyMatchingInput => ({
  id: 'prop-1',
  canton: 'ZH',
  zip: '8001',
  rooms: 3.5,
  rentPerMonth: 2200,
  availableFrom: new Date('2026-06-01T00:00:00.000Z'),
  status: 'active',
})

const baseSeeker = (): SeekerMatchingInput => ({
  cantonPreference: 'ZH',
  postalCodesWanted: null,
  budgetMin: null,
  budgetMax: 3000,
  minRooms: 3,
  maxRooms: 4,
  moveInEarliest: new Date('2026-05-01T00:00:00.000Z'),
  moveInLatest: new Date('2026-12-31T00:00:00.000Z'),
  hasPets: false,
})

describe('parsePostalCodesList', () => {
  it('splits comma and semicolon lists', () => {
    expect(parsePostalCodesList('8001, 8004;8005')).toEqual(['8001', '8004', '8005'])
  })
  it('returns empty for blank', () => {
    expect(parsePostalCodesList('')).toEqual([])
    expect(parsePostalCodesList(null)).toEqual([])
  })
})

describe('evaluateMatch — Budget', () => {
  it('hard-fails when rent above budgetMax', () => {
    const s = baseSeeker()
    const p = baseProperty()
    p.rentPerMonth = 4000
    const r = evaluateMatch(s, p, {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'BUDGET_MAX_EXCEEDED')).toBe(true)
  })

  it('hard-fails when rent below budgetMin', () => {
    const s = baseSeeker()
    s.budgetMin = 2500
    s.budgetMax = null
    const p = baseProperty()
    p.rentPerMonth = 2200
    const r = evaluateMatch(s, p, {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'BUDGET_MIN_NOT_MET')).toBe(true)
  })
})

describe('evaluateMatch — Region', () => {
  it('hard-fails on canton mismatch', () => {
    const s = baseSeeker()
    s.cantonPreference = 'BE'
    const r = evaluateMatch(s, baseProperty(), {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'CANTON_MISMATCH')).toBe(true)
  })

  it('hard-fails when PLZ list set and zip not included', () => {
    const s = baseSeeker()
    s.postalCodesWanted = '3000,3011'
    const r = evaluateMatch(s, baseProperty(), {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'POSTAL_CODE_NOT_IN_LIST')).toBe(true)
  })
})

describe('evaluateMatch — Zimmer', () => {
  it('hard-fails when rooms below minRooms', () => {
    const s = baseSeeker()
    const p = baseProperty()
    p.rooms = 2.5
    const r = evaluateMatch(s, p, {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'ROOMS_BELOW_MIN')).toBe(true)
  })
})

describe('evaluateMatch — Einzug', () => {
  it('hard-fails when availableFrom after moveInLatest', () => {
    const s = baseSeeker()
    const p = baseProperty()
    p.availableFrom = new Date('2027-01-01T00:00:00.000Z')
    const r = evaluateMatch(s, p, {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'MOVE_IN_TOO_LATE')).toBe(true)
  })
})

describe('evaluateMatch — Haustier-Policy', () => {
  it('hard-fails when seeker has pets and landlord disallows', () => {
    const s = baseSeeker()
    s.hasPets = true
    const rules: LandlordMatchingRules = { allowPets: false }
    const r = evaluateMatch(s, baseProperty(), rules)
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'PETS_NOT_ALLOWED')).toBe(true)
  })

  it('passes when seeker has pets and landlord allows', () => {
    const s = baseSeeker()
    s.hasPets = true
    const rules: LandlordMatchingRules = { allowPets: true }
    const r = evaluateMatch(s, baseProperty(), rules)
    expect(r.hardFailed).toBe(false)
    expect(r.reasons.some(x => x.code === 'PETS_ALLOWED')).toBe(true)
  })
})

describe('evaluateMatch — Objekt-Status', () => {
  it('hard-fails when property not active', () => {
    const p = baseProperty()
    p.status = 'draft'
    const r = evaluateMatch(baseSeeker(), p, {})
    expect(r.hardFailed).toBe(true)
    expect(r.reasons.some(x => x.code === 'PROPERTY_NOT_ACTIVE')).toBe(true)
  })
})

describe('evaluateMatch — happy path', () => {
  it('returns soft reasons and score in 0–100', () => {
    const r = evaluateMatch(baseSeeker(), baseProperty(), {})
    expect(r.hardFailed).toBe(false)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.reasons.length).toBeGreaterThan(0)
  })
})
