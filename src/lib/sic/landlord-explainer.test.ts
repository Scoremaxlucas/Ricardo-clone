import { describe, expect, it } from 'vitest'
import {
  SIC_VERIFY_STATE_TITLES,
  sicLandlordExplainerCopy,
  sicLandlordGuideCopy,
} from '@/lib/sic/landlord-explainer'
import { SIC_UNSEALED_NOTE } from '@/lib/sic/modules'

function blob(opts: { completenessLabel: string; sealed: boolean }): string {
  const c = sicLandlordExplainerCopy(opts)
  return [c.kicker, c.lead, c.workingNote, ...c.items.flatMap(i => [i.title, i.body]), c.kiNote].join(' ')
}

describe('sicLandlordExplainerCopy', () => {
  it('covers the five landlord facts without Auskunftei-language', () => {
    const text = blob({ completenessLabel: '2 von 4 Angaben geprüft', sealed: true })
    expect(text).toMatch(/Für Vermieterinnen und Vermieter/)
    expect(text).toMatch(/Plausib|plausibel/)
    expect(text).toMatch(/behördliche Auskunft/)
    expect(text).toMatch(/rufen niemanden an/)
    expect(text).toMatch(/Ämtern/)
    expect(text).toMatch(/2 von 4 Angaben geprüft/)
    expect(text).toMatch(/kein Negativbefund/)
    expect(text).toMatch(/3×-Regel/)
    expect(text).toMatch(/unteren Bandrand/)
    expect(text).toMatch(/Betreibungsauszugs/)
    expect(text).toMatch(/3 Monate/)
    expect(text).toMatch(/KI-Dienst/)
    expect(text).toMatch(/menschliche Freigabe/)
    expect(text).not.toMatch(/stützen/)
    expect(text).not.toMatch(/Zusage/)
    expect(text).not.toMatch(/Bonitätsauskunft|Auskunftei/)
  })

  it('explains the missing seal', () => {
    const open = sicLandlordExplainerCopy({
      completenessLabel: '1 von 4 Angaben geprüft',
      sealed: false,
    })
    expect(open.workingNote).toBe(SIC_UNSEALED_NOTE)
    const sealed = sicLandlordExplainerCopy({
      completenessLabel: '2 von 4 Angaben geprüft',
      sealed: true,
    })
    expect(sealed.workingNote).toBeNull()
  })

  it('points to AGB and Datenschutz', () => {
    const copy = sicLandlordExplainerCopy({
      completenessLabel: '4 von 4 Angaben geprüft',
      sealed: true,
    })
    expect(copy.agbHref).toBe('/sic/agb')
    expect(copy.datenschutzHref).toBe('/sic/datenschutz')
    expect(copy.guideHref).toBe('/sic/vermieter')
  })
})

describe('sicLandlordGuideCopy', () => {
  const guide = sicLandlordGuideCopy()
  const byId = (id: string) => {
    const section = guide.sections.find(s => s.id === id)
    if (!section) throw new Error(`Abschnitt fehlt: ${id}`)
    return [section.title, ...section.paragraphs, ...(section.bullets ?? []), ...(section.points ?? []).flatMap(p => [p.title, p.body])].join(' ')
  }

  it('covers every topic a landlord needs, in a fixed order', () => {
    expect(guide.sections.map(s => s.id)).toEqual([
      'was-es-ist',
      'was-es-nicht-ist',
      'markierungen',
      'siegel',
      'betreibungen',
      'drei-mal-regel',
      'gueltigkeit',
      'verifizieren',
    ])
  })

  it('says what the certificate is not', () => {
    const text = byId('was-es-nicht-ist')
    expect(text).toMatch(/keine Zusage und keine Garantie/)
    expect(text).toMatch(/keine behördliche Auskunft/)
    expect(text).toMatch(/keine Bonitätsbewertung/)
    expect(text).toMatch(/keine Empfehlung/)
    expect(text).toMatch(/Ämtern/)
  })

  it('never discloses Verlustscheine and names the small-debt exception', () => {
    const text = byId('betreibungen')
    expect(text).toMatch(/Verlustscheine werden nie freigegeben/)
    expect(text).toMatch(/höchstens zwei, zusammen unter CHF 1’000/)
    expect(text).toMatch(/zugestimmt/)
  })

  it('explains the verify states with the titles the verify page shows', () => {
    const text = byId('verifizieren')
    expect(text).toContain(SIC_VERIFY_STATE_TITLES.replaced)
    expect(text).toContain(SIC_VERIFY_STATE_TITLES.revoked)
    expect(text).toContain(SIC_VERIFY_STATE_TITLES.expired)
    expect(text).toContain(SIC_VERIFY_STATE_TITLES.unknown)
    expect(text).toMatch(/kein Negativbefund/)
  })

  it('keeps Auskunftei-language and sales talk out', () => {
    const all = guide.sections.map(s => byId(s.id)).join(' ')
    expect(all).not.toMatch(/Bonitätsauskunft|Auskunftei|stützen/)
    expect(all).not.toMatch(/CHF 79|CHF 30/)
  })
})
