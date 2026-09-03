import { afterEach, describe, expect, it } from 'vitest'
import { isSicAdminEmail, parseSicAdminEmails } from '@/lib/sic/admin-access'

describe('parseSicAdminEmails', () => {
  it('normalizes, splits and drops junk', () => {
    expect(parseSicAdminEmails(' Lucas@Example.CH , other@sic.ch, ,not-an-email ')).toEqual([
      'lucas@example.ch',
      'other@sic.ch',
    ])
  })

  it('is empty when unset', () => {
    expect(parseSicAdminEmails(undefined)).toEqual([])
    expect(parseSicAdminEmails('')).toEqual([])
  })
})

describe('isSicAdminEmail', () => {
  const prev = process.env.SIC_ADMIN_EMAILS

  afterEach(() => {
    if (prev === undefined) delete process.env.SIC_ADMIN_EMAILS
    else process.env.SIC_ADMIN_EMAILS = prev
  })

  it('does not fall back to Helvenda isAdmin — empty list admits nobody', () => {
    delete process.env.SIC_ADMIN_EMAILS
    expect(isSicAdminEmail('admin@helvenda.ch')).toBe(false)
  })

  it('matches only the allowlist', () => {
    process.env.SIC_ADMIN_EMAILS = 'pruefung@swissimmocert.ch'
    expect(isSicAdminEmail('pruefung@swissimmocert.ch')).toBe(true)
    expect(isSicAdminEmail('  PRUEFUNG@swissimmocert.ch ')).toBe(true)
    expect(isSicAdminEmail('admin@helvenda.ch')).toBe(false)
  })
})
