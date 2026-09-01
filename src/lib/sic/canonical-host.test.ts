import { describe, expect, it } from 'vitest'
import { isSicWwwHostname, sicApexHostname, sicApiBlockedOffHost, sicAppBlockedOffHost, SIC_SITE_ORIGIN, isSicProductionHostname } from '@/lib/sic/config'

describe('SIC apex canonical host', () => {
  it('treats www as an alias of the apex, not a second product', () => {
    expect(sicApexHostname()).toBe('swissimmocert.ch')
    expect(SIC_SITE_ORIGIN).not.toMatch(/www\./)
    expect(isSicWwwHostname('www.swissimmocert.ch')).toBe(true)
    expect(isSicWwwHostname('www.swissimmocert.ch:443')).toBe(true)
    expect(isSicWwwHostname('swissimmocert.ch')).toBe(false)
    expect(isSicWwwHostname('www.helvenda.ch')).toBe(false)
    expect(isSicWwwHostname('localhost')).toBe(false)
    expect(isSicProductionHostname('wohnen.helvenda.ch')).toBe(false)
    expect(isSicProductionHostname('helvenda.ch')).toBe(false)
  })

  it('blocks /api/sic on non-SIC hosts', () => {
    expect(sicApiBlockedOffHost(false, '/api/sic/quote')).toBe(true)
    expect(sicApiBlockedOffHost(true, '/api/sic/quote')).toBe(false)
    expect(sicApiBlockedOffHost(false, '/api/stripe/webhook')).toBe(false)
  })

  it('does not serve /sic on Helvenda', () => {
    expect(sicAppBlockedOffHost(false, '/sic')).toBe(true)
    expect(sicAppBlockedOffHost(false, '/sic/faq')).toBe(true)
    expect(sicAppBlockedOffHost(true, '/sic')).toBe(false)
  })
})
