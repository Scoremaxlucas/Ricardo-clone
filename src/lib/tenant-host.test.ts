import { describe, expect, it } from 'vitest'
import { isSicSiteHostFromHeaders, isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'

function headers(host: string, cookie = ''): { get(name: string): string | null } {
  const map: Record<string, string> = { host }
  if (cookie) map.cookie = cookie
  return { get: (name) => map[name] ?? null }
}

describe('tenant hosts stay separate', () => {
  it('treats swissimmocert as SIC, not Helvenda Wohnen', () => {
    const h = headers('swissimmocert.ch')
    expect(isSicSiteHostFromHeaders(h)).toBe(true)
    expect(isWohnenMatchingHostFromHeaders(h)).toBe(false)
  })

  it('treats wohnen.helvenda.ch as Helvenda Wohnen, not SIC', () => {
    const h = headers('wohnen.helvenda.ch')
    expect(isSicSiteHostFromHeaders(h)).toBe(false)
    expect(isWohnenMatchingHostFromHeaders(h)).toBe(true)
  })

  it('treats helvenda.ch as neither SIC nor Wohnen', () => {
    const h = headers('www.helvenda.ch')
    expect(isSicSiteHostFromHeaders(h)).toBe(false)
    expect(isWohnenMatchingHostFromHeaders(h)).toBe(false)
  })

  it('uses separate localhost preview cookies', () => {
    expect(isSicSiteHostFromHeaders(headers('localhost', 'sic-preview=1'))).toBe(true)
    expect(isWohnenMatchingHostFromHeaders(headers('localhost', 'sic-preview=1'))).toBe(false)
    expect(isSicSiteHostFromHeaders(headers('localhost', 'helvenda-wohnen-preview=1'))).toBe(false)
    expect(isWohnenMatchingHostFromHeaders(headers('localhost', 'helvenda-wohnen-preview=1'))).toBe(true)
  })
})
