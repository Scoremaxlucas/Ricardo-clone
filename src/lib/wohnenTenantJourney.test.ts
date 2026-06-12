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

  it('prioritises matches when active certificate exists', () => {
    const cta = deriveWohnenHomeCta({
      profile: {
        isComplete: true,
        creditCheckStatus: 'APPROVED',
        creditCheckExpiresAt: new Date('2027-01-01'),
      },
      hasActiveCertificate: true,
    })
    expect(cta.primaryHref).toBe('/meine-matches')
    expect(cta.secondaryHref).toBe('/zertifikat')
    expect(cta.footerTenantHref).toBe('/meine-matches')
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
  it('uses action-first hero for ready users with bonus in subtext', () => {
    const hero = deriveWohnenHomeHero({ stage: 'ready', activeCount: 2 })
    expect(hero.line1).toBe('Du bist bereit.')
    expect(hero.line2).toBe('Jetzt die passende Wohnung finden.')
    expect(hero.subtext).toMatch(/CHF 250/)
    expect(hero.subtext).toMatch(/2 passende Inserate/)
    expect(hero.bullets).toEqual([])
    expect(hero.showBonusPill).toBe(false)
  })

  it('uses certificate-first headline for anonymous cold start', () => {
    const hero = deriveWohnenHomeHero({ stage: 'anonymous', activeCount: 2 })
    expect(hero.line1).toMatch(/Helvenda-Zertifikat/)
    expect(hero.subtext).not.toMatch(/sobald sie live sind/i)
    expect(hero.showBonusPill).toBe(true)
  })
})
