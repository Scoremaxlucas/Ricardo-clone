import { describe, expect, it } from 'vitest'
import { sanitizeEmailUrl } from './url-safety'

describe('sanitizeEmailUrl', () => {
  it('allows swissimmocert.ch links', () => {
    const url = 'https://swissimmocert.ch/sic/zertifikat'
    expect(sanitizeEmailUrl(url)).toBe(url)
  })

  it('allows www.swissimmocert.ch links', () => {
    const url = 'https://www.swissimmocert.ch/sic/verify/SIC-2026-ABCDEFGH'
    expect(sanitizeEmailUrl(url)).toBe(url)
  })

  it('allows helvenda.ch links', () => {
    const url = 'https://www.helvenda.ch/login'
    expect(sanitizeEmailUrl(url)).toBe(url)
  })
})
