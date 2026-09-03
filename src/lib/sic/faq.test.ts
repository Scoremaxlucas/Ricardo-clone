import { SIC_FAQ } from '@/lib/sic/faq'
import { describe, expect, it } from 'vitest'

describe('SIC FAQ copy', () => {
  it('stays tenant-first and does not promise a marketplace or a Zusage', () => {
    const blob = SIC_FAQ.map(i => `${i.q} ${i.a}`).join(' ')
    expect(blob).toMatch(/Zusage/)
    expect(blob).not.toMatch(/Stapel|kennenlernen|Überall bewerben|Besichtigung/)
  })

  it('positions checked facts over unread-dossier copy, without promising a Zusage', () => {
    const blob = SIC_FAQ.map(i => `${i.q} ${i.a}`).join(' ')
    expect(blob).toMatch(/Selbstauskunft/)
    expect(blob).toMatch(/Unterscheidungsmerkmal/)
    expect(blob).toMatch(/Plausib|plausibel/)
    expect(blob).toMatch(/behördliche Auskunft/)
    expect(blob).not.toMatch(/stützen/)
    expect(blob).not.toMatch(/überblättert|ungelesen|fünf Anhänge/)
    expect(blob).not.toMatch(/Prüfaufwand|sticht heraus|Chance, ernst/)
    expect(blob).toMatch(/Betreibungsauszugs/)
    expect(blob).not.toMatch(/verlängert sich die Gültigkeit erneut/)
    expect(blob).toMatch(/E-Mail falsch geschrieben/)
    expect(blob).toMatch(/einmal ändern/)
    expect(blob).toMatch(/sieben Tage/)
  })
})
