import { describe, expect, it } from 'vitest'
import { SIC_CERT_TAGLINE, SIC_COLORS, SIC_HOUSE_MARK, SIC_META_DESCRIPTION, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE, SIC_REVIEW_SLA, SIC_REVIEW_SLA_SENTENCE } from '@/lib/sic/config'
import { SIC_MODULE_BADGE } from '@/lib/sic/modules'

describe('SIC_BRAND_NAME', () => {
  it('is one public wordmark', () => {
    expect(SIC_BRAND_NAME).toBe('Swiss Immo Cert')
    expect(SIC_BRAND_NAME).not.toMatch(/SwissImmoCert/)
    expect(SIC_BRAND_NAME).not.toMatch(/SWISS IMMO CERT/)
  })
})

describe('SIC_ISSUER_LINE', () => {
  it('is the public brand, not the GmbH', () => {
    expect(SIC_ISSUER_LINE).toBe('Swiss Immo Cert · Prüfung')
    expect(SIC_ISSUER_LINE).not.toMatch(/Score-Max|GmbH/)
  })
})

describe('SIC_CERT_TAGLINE', () => {
  it('stays within what the AGB can defend', () => {
    expect(SIC_CERT_TAGLINE).toBe('Geprüft. Standardisiert. Prüfbar.')
    expect(SIC_CERT_TAGLINE).not.toMatch(/Vertrauenswürdig/)
  })
})

describe('SIC_META_DESCRIPTION', () => {
  it('names the certificate and the landlord decision, not unread applications', () => {
    expect(SIC_META_DESCRIPTION).toMatch(/Mieter-Zertifikat/)
    expect(SIC_META_DESCRIPTION).toMatch(/plausibel geprüft/)
    expect(SIC_META_DESCRIPTION).toMatch(/keine behördliche Auskunft/i)
    expect(SIC_META_DESCRIPTION).not.toMatch(/stützen/)
    expect(SIC_META_DESCRIPTION).not.toMatch(/ungelesen|gelesen|Risiko/)
  })
})

describe('SIC_MODULE_BADGE', () => {
  it('says geprüft, not Auskunftei-verifiziert', () => {
    expect(SIC_MODULE_BADGE).toBe('GEPRÜFT')
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

describe('SIC_HOUSE_MARK', () => {
  it('is a house with a cross, not a federal coat of arms', () => {
    expect(SIC_HOUSE_MARK.outline).toMatch(/24 8/)
    expect(SIC_HOUSE_MARK.outline).not.toMatch(/L36 6/)
  })
})

describe('SIC_REVIEW_SLA', () => {
  it('promises a working day, not 24 hours', () => {
    expect(SIC_REVIEW_SLA).toBe('in der Regel innerhalb eines Werktags nach Eingang')
    expect(SIC_REVIEW_SLA).not.toMatch(/24/)
    expect(SIC_REVIEW_SLA_SENTENCE).toBe('In der Regel innerhalb eines Werktags nach Eingang.')
  })
})
