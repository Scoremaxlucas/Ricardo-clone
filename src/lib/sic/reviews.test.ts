import { describe, expect, it } from 'vitest'
import { SIC_REVIEWS, SIC_USE_CASES, sicLandingHasReviews } from '@/lib/sic/reviews'

describe('SIC social proof', () => {
  it('exposes reviews when any are present and use-cases stay untouched', () => {
    expect(sicLandingHasReviews()).toBe(SIC_REVIEWS.length > 0)
    const blob = SIC_USE_CASES.map(s => `${s.title} ${s.body}`).join(' ')
    // Erfundene Namen der frühen Prototypen dürfen nicht wieder auftauchen.
    expect(blob).not.toMatch(/Lara|Marco|Sofie/)
    expect(blob).not.toMatch(/Besichtigung|Wohnungszusage/)
    expect(blob).not.toMatch(/Stapel/)
    expect(blob).toMatch(/Vermieter/)
  })

  it('has properly structured review entries (name, place, quote, optional photo/role)', () => {
    for (const r of SIC_REVIEWS) {
      expect(r.quote.length).toBeGreaterThan(20)
      expect(r.name.length).toBeGreaterThan(0)
      expect(r.place.length).toBeGreaterThan(0)
      if (r.photo !== undefined) {
        // Fotos müssen unter dem Testimonial-Pfad liegen (public/sic/testimonials/*).
        expect(r.photo).toMatch(/^\/sic\/testimonials\/.+\.(png|jpe?g|webp)$/i)
      }
      if (r.role !== undefined) {
        expect(r.role.length).toBeGreaterThan(0)
      }
    }
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
    expect(blob).toMatch(/Prüfaufwand/i)
    expect(blob).toMatch(/Bewerbungen/i)
    expect(blob).toMatch(/Entscheidung/i)
    expect(blob).not.toMatch(/Selbstauskunft/i)
    expect(blob).toMatch(/nachvollziehbar/i)
    expect(blob).not.toMatch(/stützen|Grundlage für die Auswahl/)
    expect(blob).not.toMatch(/überblättert|ungelesen|fünf Dateien|Wette/)
  })
})
