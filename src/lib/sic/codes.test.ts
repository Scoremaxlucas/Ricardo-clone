import { describe, expect, it } from 'vitest'
import { sicReplacedCertificateCopy } from '@/lib/sic/codes'

describe('sicReplacedCertificateCopy', () => {
  it('names the replacement without leaking holder data or the new code', () => {
    const copy = sicReplacedCertificateCopy(new Date(2026, 8, 3))
    const blob = `${copy.title} ${copy.lead} ${copy.follow}`
    expect(copy.title).toBe('Ersetzt')
    expect(blob).toContain('03.09.2026')
    expect(blob).toMatch(/neuen Code ersetzt/)
    expect(blob).toMatch(/Bewerber/)
    expect(blob).not.toMatch(/unbekannt/)
    expect(blob).not.toMatch(/stützen/)
    expect(blob).not.toMatch(/SIC-/)
    expect(blob).not.toMatch(/Muster/)
    expect(blob).not.toMatch(/Zusage/)
  })
})
