import { describe, expect, it } from 'vitest'
import { SIC_REVIEWS, SIC_USE_CASES, sicLandingHasReviews } from '@/lib/sic/reviews'

describe('SIC social proof', () => {
  it('does not invent customer names while reviews are empty', () => {
    expect(sicLandingHasReviews()).toBe(false)
    expect(SIC_REVIEWS).toHaveLength(0)
    const blob = SIC_USE_CASES.map(s => `${s.title} ${s.body}`).join(' ')
    expect(blob).not.toMatch(/Lara|Marco|Sofie/)
    expect(blob).not.toMatch(/Besichtigung|Wohnungszusage/)
    expect(blob).not.toMatch(/Stapel/)
    expect(blob).toMatch(/Vermieter/)
  })

  it('keeps use-cases as situations, not quotes from people', () => {
    expect(SIC_USE_CASES).toHaveLength(3)
    for (const s of SIC_USE_CASES) {
      expect(s).not.toHaveProperty('name')
      expect(s).not.toHaveProperty('initials')
      expect(s.title.length).toBeGreaterThan(8)
    }
  })

  it('positions checked facts and exclusivity, not merely being read', () => {
    const blob = SIC_USE_CASES.map(i => `${i.title} ${i.body}`).join(' ')
    expect(blob).toMatch(/Selbstauskunft/)
    expect(blob).toMatch(/unterscheidet/)
    expect(blob).not.toMatch(/überblättert|ungelesen|fünf Dateien|Wette|Aufwand/)
  })
})
