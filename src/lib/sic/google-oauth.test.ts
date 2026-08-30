import { describe, expect, it } from 'vitest'
import { SIC_SITE_ORIGIN } from '@/lib/sic/config'
import {
  googleOAuthCallbackUrlForHost,
  shouldRedirectSicWwwToApex,
  sicGoogleOAuthCallbackUrl,
  sicPostLoginPath,
} from '@/lib/sic/google-oauth'

describe('SIC Google OAuth callback', () => {
  it('is the apex NextAuth callback, not helvenda.ch', () => {
    expect(sicGoogleOAuthCallbackUrl()).toBe(`${SIC_SITE_ORIGIN}/api/auth/callback/google`)
    expect(sicGoogleOAuthCallbackUrl()).toContain('swissimmocert.ch')
    expect(sicGoogleOAuthCallbackUrl()).not.toContain('helvenda.ch')
    expect(sicGoogleOAuthCallbackUrl()).not.toContain('www.')
  })

  it('uses the SIC callback on www and apex, marketplace stays on NEXTAUTH_URL', () => {
    expect(googleOAuthCallbackUrlForHost('swissimmocert.ch')).toBe(sicGoogleOAuthCallbackUrl())
    expect(googleOAuthCallbackUrlForHost('www.swissimmocert.ch')).toBe(sicGoogleOAuthCallbackUrl())
    expect(googleOAuthCallbackUrlForHost('www.helvenda.ch')).not.toBe(sicGoogleOAuthCallbackUrl())
    expect(googleOAuthCallbackUrlForHost('www.helvenda.ch')).toMatch(/\/api\/auth\/callback\/google$/)
  })

  it('sends www auth traffic to the apex so the OAuth cookie survives', () => {
    expect(shouldRedirectSicWwwToApex('www.swissimmocert.ch', '/api/auth/callback/google')).toBe(true)
    expect(shouldRedirectSicWwwToApex('www.swissimmocert.ch', '/login')).toBe(true)
    expect(shouldRedirectSicWwwToApex('www.swissimmocert.ch', '/sic/admin')).toBe(true)
    expect(shouldRedirectSicWwwToApex('swissimmocert.ch', '/login')).toBe(false)
    expect(shouldRedirectSicWwwToApex('www.swissimmocert.ch', '/')).toBe(false)
  })

  it('keeps relative SIC callbacks, otherwise the admin queue', () => {
    expect(sicPostLoginPath('/sic/admin')).toBe('/sic/admin')
    expect(sicPostLoginPath('https://helvenda.ch/')).toBe('/sic/admin')
    expect(sicPostLoginPath(null)).toBe('/sic/admin')
  })
})
