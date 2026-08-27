import { describe, expect, it } from 'vitest'
import { SIC_SCENARIOS } from '@/lib/sic/reviews'

describe('SIC_SCENARIOS', () => {
  it('keeps three labelled examples without invented outcomes', () => {
    expect(SIC_SCENARIOS).toHaveLength(3)
    const blob = SIC_SCENARIOS.map(s => `${s.quote} ${s.name} ${s.place}`).join(' ')
    expect(blob).not.toMatch(/Besichtigung/)
    expect(blob).not.toMatch(/bestätigt/)
    expect(blob).not.toMatch(/Wohnungszusage/)
  })

  it('uses initials instead of photos', () => {
    for (const s of SIC_SCENARIOS) {
      expect(s.initials).toMatch(/^[A-Z]{2}$/)
      expect(s).not.toHaveProperty('photo')
      expect(s).not.toHaveProperty('image')
    }
  })
})
