import { describe, expect, it } from 'vitest'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'

describe('SIC_CERT_TAGLINE', () => {
  it('stays within what the AGB can defend', () => {
    expect(SIC_CERT_TAGLINE).toBe('Geprüft. Standardisiert. Prüfbar.')
    expect(SIC_CERT_TAGLINE).not.toMatch(/Vertrauenswürdig/)
  })
})
