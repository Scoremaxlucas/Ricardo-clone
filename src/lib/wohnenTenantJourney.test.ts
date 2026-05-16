import { describe, expect, it } from 'vitest'
import {
  creditApprovedValid,
  deriveWohnenHomeCta,
  deriveWohnenHomeHero,
  deriveWohnenJourneyStage,
} from './wohnenTenantJourney'

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

describe('deriveWohnenJourneyStage', () => {
  it('returns ready when profile complete, credit ok, certificate active', () => {
    expect(
      deriveWohnenJourneyStage({
        signedIn: true,
        profile: {
          isComplete: true,
          creditCheckStatus: 'APPROVED',
          creditCheckExpiresAt: new Date('2027-01-01'),
        },
        hasActiveCertificate: true,
      })
    ).toBe('ready')
  })
})

describe('deriveWohnenHomeHero', () => {
  it('does not promise future listings when ready user has active inventory', () => {
    const hero = deriveWohnenHomeHero({ stage: 'ready', activeCount: 2 })
    expect(hero.line1).toBe('Passende Wohnungen.')
    expect(hero.subtext).not.toMatch(/kommen dazu/i)
    expect(hero.subtext).toMatch(/2/)
  })

  it('uses certificate-first headline for anonymous cold start', () => {
    const hero = deriveWohnenHomeHero({ stage: 'anonymous', activeCount: 2 })
    expect(hero.line1).toMatch(/Qualitätsnachweis/)
    expect(hero.subtext).not.toMatch(/sobald sie live sind/i)
  })
})
