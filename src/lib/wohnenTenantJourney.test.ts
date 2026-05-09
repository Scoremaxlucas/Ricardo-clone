import { describe, expect, it } from 'vitest'
import { creditApprovedValid, deriveWohnenHomeCta } from './wohnenTenantJourney'

describe('creditApprovedValid', () => {
  it('returns false when not APPROVED', () => {
    const now = new Date('2026-06-01T12:00:00Z')
    expect(
      creditApprovedValid(
        { creditCheckStatus: 'PENDING', creditCheckExpiresAt: new Date('2027-01-01') },
        now
      )
    ).toBe(false)
  })

  it('returns true when APPROVED and expiry in future', () => {
    const now = new Date('2026-06-01T12:00:00Z')
    expect(
      creditApprovedValid(
        { creditCheckStatus: 'APPROVED', creditCheckExpiresAt: new Date('2027-01-01') },
        now
      )
    ).toBe(true)
  })
})

describe('deriveWohnenHomeCta', () => {
  it('prioritises certificate when credit ok and no active certificate', () => {
    const cta = deriveWohnenHomeCta({
      profile: {
        isComplete: true,
        creditCheckStatus: 'APPROVED',
        creditCheckExpiresAt: new Date('2027-01-01'),
      },
      hasActiveCertificate: false,
    })
    expect(cta.primaryHref).toBe('/zertifikat')
    expect(cta.secondaryHref).toBe('/meine-matches')
  })

  it('prioritises matches when certificate exists', () => {
    const cta = deriveWohnenHomeCta({
      profile: {
        isComplete: true,
        creditCheckStatus: 'APPROVED',
        creditCheckExpiresAt: new Date('2027-01-01'),
      },
      hasActiveCertificate: true,
    })
    expect(cta.primaryHref).toBe('/meine-matches')
    expect(cta.footerTenantHref).toBe('/wohnungen')
  })
})
