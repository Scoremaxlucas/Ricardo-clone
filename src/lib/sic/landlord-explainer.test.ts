import { describe, expect, it } from 'vitest'
import { sicLandlordExplainerCopy } from '@/lib/sic/landlord-explainer'
import { SIC_WORKING_NOTICE } from '@/lib/sic/modules'

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

  it('names the working document when the seal is not ready', () => {
    const open = sicLandlordExplainerCopy({
      completenessLabel: '1 von 4 Angaben geprüft',
      sealed: false,
    })
    expect(open.workingNote).toBe(SIC_WORKING_NOTICE)
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
  })
})
