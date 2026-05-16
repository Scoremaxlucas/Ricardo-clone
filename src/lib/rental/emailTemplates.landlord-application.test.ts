import { describe, expect, it } from 'vitest'
import { templateLandlordNewApplication } from '@/lib/rental/emailTemplates'

const base = {
  landlordFirstName: null as string | null,
  listingTitle: 'Testwohnung',
  listingId: 'listing_1',
  applicantFullName: 'Max Muster',
  applicantContactPhone: '+41 79 000 00 00',
  applicantContactEmail: 'bewerber@example.com',
  employmentStatus: 'EMPLOYED' as const,
  employer: 'UBS',
  incomeCategory: 'FROM_4000_TO_5500' as const,
  requiresCreditCheck: true,
  creditCheckResult: { hasEntries: false, entryCount: 0 },
  referenceName: 'Ref',
  referencePhone: '+41 79 111 11 11',
  applicantMessage: null,
  applicantSummary: 'Kurzprofil',
  certificateCode: 'HLV-2026-TEST',
  landlordRespondUrl: 'https://wohnen.helvenda.ch/lead/test-token',
  landlordNoResponseDays: 5,
}

describe('templateLandlordNewApplication CTA', () => {
  it('shows platform link for self-service landlords', () => {
    const { html, text } = templateLandlordNewApplication({
      ...base,
      landlordCanViewOnPlatform: true,
    })
    expect(html).toContain('Bewerbung auf Helvenda')
    expect(html).toContain('/matching/properties/listing_1/bewerbungen')
    expect(html).not.toContain('Bewerber kontaktieren')
    expect(text).toContain('/matching/properties/listing_1/bewerbungen')
  })

  it('shows direct contact CTAs for admin-import listings', () => {
    const { html, text } = templateLandlordNewApplication({
      ...base,
      landlordCanViewOnPlatform: false,
    })
    expect(html).not.toContain('Bewerbung ansehen')
    expect(html).not.toContain('/matching/properties/')
    expect(html).not.toContain('Bewerber kontaktieren')
    expect(html).not.toContain('mailto:')
    expect(html).toContain('Antwort erfassen')
    expect(html).toContain('Qualitätsnachweis prüfen')
    expect(text).toContain('bewerber@example.com')
    expect(text).not.toContain('/matching/properties/')
  })
})
