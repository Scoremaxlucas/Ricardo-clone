import { describe, expect, it } from 'vitest'
import {
  isListingExpiredByChCalendar,
  isValidYmd,
  rentalListingHasMonitoringHttpUrl,
  validateListingExpiresOnForUpsert,
} from '@/lib/rental/rental-listing-expiry-on'

describe('rentalListingHasMonitoringHttpUrl', () => {
  it('accepts allowlisted importedFrom', () => {
    expect(rentalListingHasMonitoringHttpUrl({ importedFrom: 'https://www.tutti.ch/vi/x' })).toBe(true)
  })
  it('rejects homegate importedFrom', () => {
    expect(rentalListingHasMonitoringHttpUrl({ importedFrom: 'https://www.homegate.ch/rent/x' })).toBe(false)
  })
  it('rejects tutti label', () => {
    expect(rentalListingHasMonitoringHttpUrl('Tutti.ch')).toBe(false)
  })
  it('rejects empty', () => {
    expect(rentalListingHasMonitoringHttpUrl(null)).toBe(false)
  })
})

describe('isValidYmd', () => {
  it('accepts valid', () => {
    expect(isValidYmd('2026-05-15')).toBe(true)
  })
  it('rejects invalid calendar', () => {
    expect(isValidYmd('2026-02-31')).toBe(false)
  })
})

describe('validateListingExpiresOnForUpsert', () => {
  it('requires date without monitoring url', () => {
    const r = validateListingExpiresOnForUpsert({
      hasMonitoringUrl: false,
      listingExpiresOn: null,
      intent: 'create',
    })
    expect(r.ok).toBe(false)
  })
  it('allows null with monitoring url', () => {
    const r = validateListingExpiresOnForUpsert({
      hasMonitoringUrl: true,
      listingExpiresOn: null,
      intent: 'create',
    })
    expect(r.ok).toBe(true)
  })
  it('allows unchanged past on edit', () => {
    const r = validateListingExpiresOnForUpsert({
      hasMonitoringUrl: false,
      listingExpiresOn: '2020-01-01',
      intent: 'edit',
      existingListingExpiresOn: '2020-01-01',
    })
    expect(r.ok).toBe(true)
  })
  it('defaults expiry instead of blocking when defaultExpiresOnDays is set', () => {
    const r = validateListingExpiresOnForUpsert({
      hasMonitoringUrl: false,
      listingExpiresOn: null,
      intent: 'create',
      defaultExpiresOnDays: 90,
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('isListingExpiredByChCalendar', () => {
  it('treats old ymd as expired', () => {
    const now = new Date('2030-06-01T12:00:00Z')
    expect(isListingExpiredByChCalendar('2020-01-01', now)).toBe(true)
  })
})
