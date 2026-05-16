import { describe, expect, it } from 'vitest'
import {
  extractBestEmailFromPlaintext,
  extractLandlordSalutationFromPlaintext,
  landlordLeadEmailForApplication,
  normalizeAndValidateLandlordNotifyEmail,
  resolveLandlordApplicationNotifyEmail,
  resolveLandlordSalutationFirstName,
  isHelvendaInternalListingOwnerEmail,
} from '@/lib/rental/resolve-landlord-notify-email'

describe('normalizeAndValidateLandlordNotifyEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeAndValidateLandlordNotifyEmail('  Test@Example.COM ')).toBe('test@example.com')
  })
  it('rejects invalid', () => {
    expect(normalizeAndValidateLandlordNotifyEmail('not-an-email')).toBe(null)
  })
})

describe('extractBestEmailFromPlaintext', () => {
  it('prefers last non-system address when several appear', () => {
    expect(extractBestEmailFromPlaintext('Tel 079 … mail a@b.co und c@d.ch')).toBe('c@d.ch')
  })

  it('skips noreply when a person address exists', () => {
    expect(
      extractBestEmailFromPlaintext('Bitte an noreply@portal.ch — direkt: vermieter@example.com'),
    ).toBe('vermieter@example.com')
  })

  it('falls back to noreply if it is the only address', () => {
    expect(extractBestEmailFromPlaintext('Antwort an noreply@only.invalid')).toBe('noreply@only.invalid')
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

  it('uses email from plain stored contact', () => {
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

describe('isHelvendaInternalListingOwnerEmail', () => {
  it('detects helvenda.ch owner accounts', () => {
    expect(isHelvendaInternalListingOwnerEmail('admin@helvenda.ch')).toBe(true)
    expect(isHelvendaInternalListingOwnerEmail('mk@lsp.ch')).toBe(false)
  })
})

describe('extractLandlordSalutationFromPlaintext', () => {
  it('extracts name before phone and email lines', () => {
    expect(extractLandlordSalutationFromPlaintext('Maria Müller\nRuf 079\nkontakt@landlord.ch')).toBe('Maria')
  })

  it('skips title prefix', () => {
    expect(extractLandlordSalutationFromPlaintext('Frau Beispiel\nmail@x.ch')).toBe('Beispiel')
  })

  it('parses Name: label from import contact', () => {
    expect(extractLandlordSalutationFromPlaintext('Name: Tina Lo Conte')).toBe('Tina')
    expect(extractLandlordSalutationFromPlaintext('Name: null\nKontakt: mk@lsp.ch')).toBe(null)
  })
})

describe('resolveLandlordSalutationFirstName', () => {
  it('ignores helvenda internal owner and uses contact name', () => {
    expect(
      resolveLandlordSalutationFirstName({
        landlordNotifyEmail: 'mk@lsp.ch',
        landlordContactStored: 'PLAIN1:Peter LSP\nmk@lsp.ch',
        ownerAccount: { firstName: 'Admin', name: 'Admin', email: 'admin@helvenda.ch' },
      }),
    ).toBe('Peter')
  })

  it('returns null for internal owner without contact name', () => {
    expect(
      resolveLandlordSalutationFirstName({
        landlordNotifyEmail: 'mk@lsp.ch',
        landlordContactStored: null,
        ownerAccount: { firstName: 'Admin', name: 'Admin', email: 'admin@helvenda.ch' },
      }),
    ).toBe(null)
  })
})

describe('landlordLeadEmailForApplication', () => {
  it('prefers stored email from application', () => {
    expect(
      landlordLeadEmailForApplication({
        landlordLeadEmail: 'sent@example.com',
        listing: { landlordNotifyEmail: 'other@example.com', landlordContact: null, user: { email: 'x@y.ch' } },
      }),
    ).toBe('sent@example.com')
  })
})
