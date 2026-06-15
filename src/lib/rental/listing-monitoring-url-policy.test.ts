import { describe, expect, it } from 'vitest'
import {
  isAllowlistedMonitoringUrl,
  rentalListingHasAutoMonitoring,
  rentalMonitoringUrlPolicyMessage,
  rentalReferenceUrlPolicyMessage,
  resolveListingMonitoringUrl,
} from '@/lib/rental/listing-monitoring-url-policy'

describe('rentalReferenceUrlPolicyMessage', () => {
  it('allows homegate reference', () => {
    expect(rentalReferenceUrlPolicyMessage('https://www.homegate.ch/rent/123')).toBeNull()
  })
  it('rejects non-http', () => {
    expect(rentalReferenceUrlPolicyMessage('homegate.ch/x')).toMatch(/http/i)
  })
})

describe('rentalMonitoringUrlPolicyMessage', () => {
  it('allows tutti', () => {
    expect(rentalMonitoringUrlPolicyMessage('https://www.tutti.ch/vi/123')).toBeNull()
  })
  it('blocks homegate for auto monitoring', () => {
    expect(rentalMonitoringUrlPolicyMessage('https://www.homegate.ch/rent/123')).toMatch(/Homegate/i)
  })
})

describe('resolveListingMonitoringUrl', () => {
  it('prefers monitoringUrl over importedFrom', () => {
    expect(
      resolveListingMonitoringUrl({
        monitoringUrl: 'https://www.tutti.ch/vi/a',
        importedFrom: 'https://www.urbanhome.ch/x',
      })
    ).toBe('https://www.tutti.ch/vi/a')
  })
  it('falls back to allowlisted importedFrom', () => {
    expect(
      resolveListingMonitoringUrl({
        monitoringUrl: null,
        importedFrom: 'https://www.urbanhome.ch/de/listing/1',
      })
    ).toBe('https://www.urbanhome.ch/de/listing/1')
  })
  it('ignores homegate importedFrom', () => {
    expect(
      resolveListingMonitoringUrl({
        monitoringUrl: null,
        importedFrom: 'https://www.homegate.ch/rent/1',
      })
    ).toBeNull()
  })
})

describe('isAllowlistedMonitoringUrl', () => {
  it('accepts tutti', () => {
    expect(isAllowlistedMonitoringUrl('https://www.tutti.ch/vi/1')).toBe(true)
  })
  it('rejects example.com', () => {
    expect(isAllowlistedMonitoringUrl('https://example.com/x')).toBe(false)
  })
})

describe('rentalListingHasAutoMonitoring', () => {
  it('true with monitoring url only', () => {
    expect(rentalListingHasAutoMonitoring({ monitoringUrl: 'https://www.tutti.ch/vi/1' })).toBe(true)
  })
})
