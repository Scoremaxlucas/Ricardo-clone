import { describe, expect, it } from 'vitest'
import { nextModuleStatusAfterUpload } from '@/lib/sic/module-status'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { roundSicChf, SIC_BASE_FEE_CHF, SIC_MIN_CHARGE_CHF, SIC_MODULE_FEE_CHF } from '@/lib/sic/modules'

/** Erwarteter Betrag: unter dem Stripe-Minimum wird aufs Minimum angehoben. */
function chargeable(rawChf: number): number {
  return rawChf > 0 && rawChf < SIC_MIN_CHARGE_CHF ? SIC_MIN_CHARGE_CHF : roundSicChf(rawChf)
}

describe('nextModuleStatusAfterUpload', () => {
  it('PENDING_DOCS → IN_REVIEW', () => {
    expect(nextModuleStatusAfterUpload('PENDING_DOCS')).toBe('IN_REVIEW')
  })
  it('REJECTED → IN_REVIEW (nachreichen)', () => {
    expect(nextModuleStatusAfterUpload('REJECTED')).toBe('IN_REVIEW')
  })
  it('IN_REVIEW / VERIFIED bleibt unverändert (null)', () => {
    expect(nextModuleStatusAfterUpload('IN_REVIEW')).toBeNull()
    expect(nextModuleStatusAfterUpload('VERIFIED')).toBeNull()
  })
})

describe('returning-user quote (includeBaseFee false)', () => {
  it('ohne Basis nur Modulpreis', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET'] })
    expect(q.includeBaseFee).toBe(false)
    expect(q.totalChf).toBe(chargeable(SIC_MODULE_FEE_CHF))
    expect(q.lines.some(l => l.kind === 'base')).toBe(false)
  })
  it('basis-only Erstkauf bleibt SIC_BASE_FEE (bzw. Stripe-Minimum)', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: [] })
    expect(q.totalChf).toBe(chargeable(SIC_BASE_FEE_CHF))
  })
})
