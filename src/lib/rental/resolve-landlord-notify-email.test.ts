import { describe, expect, it } from 'vitest'
import {
  extractFirstEmailFromText,
  normalizeAndValidateLandlordNotifyEmail,
  resolveLandlordApplicationNotifyEmail,
} from '@/lib/rental/resolve-landlord-notify-email'

describe('normalizeAndValidateLandlordNotifyEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeAndValidateLandlordNotifyEmail('  Test@Example.COM ')).toBe('test@example.com')
  })
  it('rejects invalid', () => {
    expect(normalizeAndValidateLandlordNotifyEmail('not-an-email')).toBe(null)
  })
})

describe('extractFirstEmailFromText', () => {
  it('finds first address', () => {
    expect(extractFirstEmailFromText('Tel 079 … mail a@b.co und c@d.ch')).toBe('a@b.co')
  })
})

describe('resolveLandlordApplicationNotifyEmail', () => {
  it('prefers landlordNotifyEmail', () => {
    expect(
      resolveLandlordApplicationNotifyEmail({
        landlordNotifyEmail: 'Direct@Example.com',
        landlordContactStored: 'PLAIN1:other@x.com',
        ownerAccountEmail: 'owner@y.com',
      }),
    ).toBe('direct@example.com')
  })

  it('uses first email from plain stored contact', () => {
    expect(
      resolveLandlordApplicationNotifyEmail({
        landlordNotifyEmail: null,
        landlordContactStored: 'PLAIN1:Vermieter\nRuf 079\nkontakt@landlord.ch',
        ownerAccountEmail: 'owner@y.com',
      }),
    ).toBe('kontakt@landlord.ch')
  })

  it('falls back to owner account email', () => {
    expect(
      resolveLandlordApplicationNotifyEmail({
        landlordNotifyEmail: ' ',
        landlordContactStored: null,
        ownerAccountEmail: 'Owner@Account.ch',
      }),
    ).toBe('owner@account.ch')
  })

  it('returns null when nothing usable', () => {
    expect(
      resolveLandlordApplicationNotifyEmail({
        landlordNotifyEmail: null,
        landlordContactStored: 'PLAIN1:keine mail',
        ownerAccountEmail: null,
      }),
    ).toBe(null)
  })
})
