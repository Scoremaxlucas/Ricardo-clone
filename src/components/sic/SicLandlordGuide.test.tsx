import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicCertExampleCard } from '@/components/sic/SicCertExampleCard'
import { SicLandlordGuide } from '@/components/sic/SicLandlordGuide'
import { sicPaths } from '@/lib/sic/config'
import { sicLandlordExplainerCopy, sicLandlordGuideCopy } from '@/lib/sic/landlord-explainer'
import {
  SIC_MODULE_BADGE,
  SIC_PLAUSIBILITY_FOOTER,
  SIC_UNCHECKED_LINE,
  SIC_UNSEALED_NOTE,
  sicSealRequirementLabel,
} from '@/lib/sic/modules'

/** Sichtbarer Text ohne Markup — Aussagen prüfen, nicht Klassen. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

describe('SicLandlordGuide', () => {
  const html = renderToStaticMarkup(<SicLandlordGuide />)
  const text = textOf(html)

  it('sagt, was das Zertifikat nicht ist: keine Zusage, kein Amt, keine Bewertung', () => {
    expect(text).toContain('keine Zusage und keine Garantie')
    expect(text).toContain('Keine behördliche Auskunft')
    expect(text).toContain(SIC_PLAUSIBILITY_FOOTER)
    expect(text).toMatch(/holen keine Auskünfte bei Ämtern ein/)
    expect(text).toMatch(/keine Bonitätsbewertung und keine Empfehlung/)
    expect(text).toMatch(/Ob du die Person nimmst, entscheidest du allein/)
  })

  it('erklärt die GEPRÜFT-Markierung und die neutrale Zeile', () => {
    expect(text).toContain(`Nur die mit «${SIC_MODULE_BADGE}» markierten Angaben sind geprüft`)
    expect(text).toContain(`«${SIC_UNCHECKED_LINE}»`)
    expect(text).toContain('kein Negativbefund')
  })

  it('erklärt das Siegel als Auszeichnung für zwei Angaben', () => {
    expect(text).toContain(`wenn ${sicSealRequirementLabel()} beide geprüft sind`)
    expect(text).toContain('kein Gütesiegel für die Person')
    expect(text).toContain(SIC_UNSEALED_NOTE)
  })

  it('weist Betreibungen in vier Fällen aus — Verlustscheine nie', () => {
    expect(text).toContain('«Keine Einträge» heisst: der Auszug ist leer.')
    expect(text).toContain('«Keine offenen Betreibungen» heisst: frühere Einträge sind erledigt.')
    expect(text).toMatch(/der Ausweisung zugestimmt — höchstens zwei, zusammen unter CHF 1’000/)
    expect(text).toContain('Verlustscheine werden nie freigegeben.')
  })

  it('erklärt 3×-Regel, Gültigkeit und die Zustände der Prüfseite', () => {
    expect(text).toContain('3×-Regel')
    expect(text).toMatch(/unteren Bandrand/)
    expect(text).toMatch(/hängt am Datum des Betreibungsauszugs — 3 Monate/)
    expect(text).toMatch(/QR-Code/)
    expect(text).toMatch(/Prüf-Link/)
    expect(text).toContain('Ersetzt')
    expect(text).toContain('Widerrufen')
    expect(text).toContain('Abgelaufen')
  })

  it('zeigt das Beispiel-Zertifikat mit einer nicht geprüften Angabe', () => {
    expect(html).toContain('SIC-2026-BEISPIEL')
    expect(text).toContain('3 von 4 Angaben geprüft')
    expect(text).toContain('Keine Einträge im Betreibungsregister')
    // Referenz steht neutral da, nicht als geprüft.
    expect(html.split(SIC_UNCHECKED_LINE).length).toBeGreaterThan(2)
  })

  it('informiert, ohne zu verkaufen', () => {
    expect(text).not.toMatch(/CHF 79|CHF 30|Jetzt|bestellen|kaufen/i)
    expect(html).not.toContain(sicPaths.certificateWorkspace)
    expect(html).toContain(sicPaths.faq)
    expect(html).toContain(sicPaths.agb)
    expect(html).toContain(sicPaths.datenschutz)
    expect(html).not.toContain('lucide')
  })

  it('nutzt dieselben Sätze wie der Erklärkasten der Prüfseite', () => {
    const verify = sicLandlordExplainerCopy({ completenessLabel: '2 von 4 Angaben geprüft', sealed: true })
    const guide = sicLandlordGuideCopy()
    const guideText = guide.sections
      .flatMap(s => [...s.paragraphs, ...(s.bullets ?? []), ...(s.points ?? []).map(p => p.body)])
      .join(' ')
    for (const item of verify.items) {
      expect(guideText).toContain(item.body)
    }
    expect(guide.lead).toBe(verify.lead)
    expect(verify.guideHref).toBe(sicPaths.landlords)
  })
})

describe('SicCertExampleCard', () => {
  it('zeigt ohne Angabe alle vier Angaben als geprüft, mit Siegel', () => {
    const html = renderToStaticMarkup(<SicCertExampleCard />)
    expect(html).toContain('4 von 4 Angaben geprüft')
    expect(html).not.toContain(SIC_UNCHECKED_LINE)
    // Eine Angabe weniger geprüft → genau eine Markierung weniger (das Siegel trägt das Wort auch).
    const badges = (markup: string) => markup.split(`>${SIC_MODULE_BADGE}<`).length - 1
    const oneLess = renderToStaticMarkup(<SicCertExampleCard uncheckedIds={['ZUVERLAESSIGKEIT']} />)
    expect(badges(html) - badges(oneLess)).toBe(1)
  })

  it('lässt das Siegel weg, wenn der Ausweis nicht geprüft ist', () => {
    const sealedHtml = renderToStaticMarkup(<SicCertExampleCard />)
    const openHtml = renderToStaticMarkup(<SicCertExampleCard uncheckedIds={['AUFENTHALT']} />)
    expect(openHtml).toContain('3 von 4 Angaben geprüft')
    expect(openHtml).toContain(SIC_UNCHECKED_LINE)
    expect(sealedHtml.split('<svg').length).toBeGreaterThan(openHtml.split('<svg').length)
  })
})
