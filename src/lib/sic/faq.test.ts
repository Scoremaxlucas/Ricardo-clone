import { SIC_FAQ } from '@/lib/sic/faq'
import { describe, expect, it } from 'vitest'

describe('SIC FAQ copy', () => {
  it('stays tenant-first and does not promise a marketplace or a Zusage', () => {
    const blob = SIC_FAQ.map(i => `${i.q} ${i.a}`).join(' ')
    expect(blob).toMatch(/Zusage/)
    expect(blob).not.toMatch(/Stapel|kennenlernen|Überall bewerben|Besichtigung/)
  })

  it('sells being taken seriously, not merely being read', () => {
    const blob = SIC_FAQ.map(i => `${i.q} ${i.a}`).join(' ')
    expect(blob).toMatch(/stützen/)
    expect(blob).toMatch(/Risiko/)
    expect(blob).toMatch(/ernst genommen/)
    expect(blob).not.toMatch(/überblättert|ungelesen|fünf Anhänge/)
  })
})
