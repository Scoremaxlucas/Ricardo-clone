import { describe, expect, it } from 'vitest'
import { SIC_BRAND_NAME, SIC_FROM_MAILBOX, SIC_SUPPORT_EMAIL, formatSicFromAddress } from '@/lib/sic/config'

describe('SIC mail identity', () => {
  it('sends as hello@, not noreply, with the brand as display name', () => {
    expect(formatSicFromAddress()).toBe(`${SIC_BRAND_NAME} <${SIC_FROM_MAILBOX}>`)
    expect(formatSicFromAddress('  ')).toBe(`${SIC_BRAND_NAME} <${SIC_FROM_MAILBOX}>`)
    expect(SIC_FROM_MAILBOX).toBe('hello@swissimmocert.ch')
    expect(formatSicFromAddress()).not.toMatch(/noreply/i)
  })

  it('keeps Reply-To on a different mailbox than From', () => {
    expect(SIC_FROM_MAILBOX).not.toBe(SIC_SUPPORT_EMAIL)
    expect(SIC_SUPPORT_EMAIL).toMatch(/@/)
  })

  it('wraps a bare override and leaves a full From line alone', () => {
    expect(formatSicFromAddress('hello@swissimmocert.ch')).toBe(
      `${SIC_BRAND_NAME} <hello@swissimmocert.ch>`
    )
    expect(formatSicFromAddress('Swiss Immo Cert <hello@swissimmocert.ch>')).toBe(
      'Swiss Immo Cert <hello@swissimmocert.ch>'
    )
  })
})
