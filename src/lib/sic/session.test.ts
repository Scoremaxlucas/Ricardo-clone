import { beforeAll, describe, expect, it } from 'vitest'
import { normalizeEmail, signSicSessionToken, verifySicSessionToken } from '@/lib/sic/session'

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
