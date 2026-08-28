import { describe, expect, it } from 'vitest'
import { SIC_CERT_TAGLINE, SIC_COLORS, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_REVIEW_SLA, SIC_REVIEW_SLA_SENTENCE } from '@/lib/sic/config'

describe('SIC_BRAND_NAME', () => {
  it('is one public wordmark', () => {
    expect(SIC_BRAND_NAME).toBe('Swiss Immo Cert')
    expect(SIC_BRAND_NAME).not.toMatch(/SwissImmoCert/)
    expect(SIC_BRAND_NAME).not.toMatch(/SWISS IMMO CERT/)
  })
})

describe('SIC_CERT_TAGLINE', () => {
  it('stays within what the AGB can defend', () => {
    expect(SIC_CERT_TAGLINE).toBe('Geprüft. Standardisiert. Prüfbar.')
    expect(SIC_CERT_TAGLINE).not.toMatch(/Vertrauenswürdig/)
  })
})

describe('sicLogoMarkHouseStroke', () => {
  it('uses paper on dark so the house does not vanish into navy', () => {
    expect(sicLogoMarkHouseStroke(false)).toBe(SIC_COLORS.navy)
    expect(sicLogoMarkHouseStroke(true)).toBe(SIC_COLORS.paper)
    expect(sicLogoMarkHouseStroke(true)).not.toBe(SIC_COLORS.navy)
    expect(sicLogoMarkHouseStroke(true)).not.toBe(SIC_COLORS.navyDeep)
  })
})

describe('SIC_REVIEW_SLA', () => {
  it('promises a working day, not 24 hours', () => {
    expect(SIC_REVIEW_SLA).toBe('in der Regel innerhalb eines Werktags nach Eingang')
    expect(SIC_REVIEW_SLA).not.toMatch(/24/)
    expect(SIC_REVIEW_SLA_SENTENCE).toBe('In der Regel innerhalb eines Werktags nach Eingang.')
  })
})
