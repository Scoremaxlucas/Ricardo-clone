import { describe, expect, it } from 'vitest'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_REVIEW_SLA, SIC_REVIEW_SLA_SENTENCE } from '@/lib/sic/config'

describe('SIC_CERT_TAGLINE', () => {
  it('stays within what the AGB can defend', () => {
    expect(SIC_CERT_TAGLINE).toBe('Geprüft. Standardisiert. Prüfbar.')
    expect(SIC_CERT_TAGLINE).not.toMatch(/Vertrauenswürdig/)
  })
})

describe('SIC_REVIEW_SLA', () => {
  it('promises a working day, not 24 hours', () => {
    expect(SIC_REVIEW_SLA).toBe('in der Regel innerhalb eines Werktags nach Eingang')
    expect(SIC_REVIEW_SLA).not.toMatch(/24/)
    expect(SIC_REVIEW_SLA_SENTENCE).toBe('In der Regel innerhalb eines Werktags nach Eingang.')
  })
})
