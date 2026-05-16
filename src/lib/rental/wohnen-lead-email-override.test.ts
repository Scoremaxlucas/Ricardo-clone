import { afterEach, describe, expect, it } from 'vitest'
import {
  getWohnenLeadEmailOverride,
  isWohnenLeadEmailOverrideActive,
  resolveWohnenLeadDelivery,
} from './wohnen-lead-email-override'

describe('wohnen-lead-email-override', () => {
  const prev = process.env.WOHNEN_LEAD_EMAIL_OVERRIDE

  afterEach(() => {
    if (prev === undefined) delete process.env.WOHNEN_LEAD_EMAIL_OVERRIDE
    else process.env.WOHNEN_LEAD_EMAIL_OVERRIDE = prev
  })

  it('returns null when env unset', () => {
    delete process.env.WOHNEN_LEAD_EMAIL_OVERRIDE
    expect(getWohnenLeadEmailOverride()).toBe(null)
    expect(isWohnenLeadEmailOverrideActive()).toBe(false)
  })

  it('redirects delivery when override set', () => {
    process.env.WOHNEN_LEAD_EMAIL_OVERRIDE = 'lucas.helvenda@outlook.com'
    const d = resolveWohnenLeadDelivery('landlord@example.com')
    expect(d.to).toBe('lucas.helvenda@outlook.com')
    expect(d.intendedEmail).toBe('landlord@example.com')
    expect(d.isOverride).toBe(true)
  })
})
