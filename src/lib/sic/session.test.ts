import {
  normalizeEmail,
  SIC_POST_CHECKOUT_TTL_SECONDS,
  sicPaidCheckoutAllowsSessionCookie,
  signSicSessionToken,
  verifySicSessionToken,
} from '@/lib/sic/session'
import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  process.env.SIC_SESSION_SECRET = 'test-secret-for-sic-session-xxxxxxxxxxxx'
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Bar.CH ')).toBe('foo@bar.ch')
  })
})

describe('sic session token', () => {
  it('round-trips email', () => {
    const token = signSicSessionToken('User@Example.com')
    expect(verifySicSessionToken(token)).toEqual({ email: 'user@example.com' })
  })
  it('rejects garbage / empty', () => {
    expect(verifySicSessionToken(null)).toBeNull()
    expect(verifySicSessionToken('not.a.jwt')).toBeNull()
  })
  it('rejects token signed with a different secret', () => {
    const token = signSicSessionToken('a@b.ch')
    process.env.SIC_SESSION_SECRET = 'a-completely-different-secret-value-yyyy'
    expect(verifySicSessionToken(token)).toBeNull()
    process.env.SIC_SESSION_SECRET = 'test-secret-for-sic-session-xxxxxxxxxxxx'
  })
})

describe('post-checkout session', () => {
  it('lasts a working day, not one hour', () => {
    expect(SIC_POST_CHECKOUT_TTL_SECONDS).toBe(24 * 60 * 60)
  })

  it('grants the cookie only for a few minutes after payment', () => {
    const paidAt = new Date('2026-08-30T16:00:00.000Z')
    expect(sicPaidCheckoutAllowsSessionCookie(paidAt, new Date('2026-08-30T16:05:00.000Z'))).toBe(true)
    expect(sicPaidCheckoutAllowsSessionCookie(paidAt, new Date('2026-08-30T16:16:00.000Z'))).toBe(false)
    expect(sicPaidCheckoutAllowsSessionCookie(null)).toBe(false)
  })
})
