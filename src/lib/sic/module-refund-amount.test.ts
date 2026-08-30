import { describe, expect, it } from 'vitest'
import { roundSicChf, SIC_MODULES } from '@/lib/sic/modules'
import { sicModuleRefundAmountChf } from '@/lib/sic/module-refund-amount'
import { quoteSicOrder } from '@/lib/sic/pricing'

const ALL = SIC_MODULES.map(m => m.id)

describe('sicModuleRefundAmountChf', () => {
  it('rejects renewal payments', () => {
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: 0.5,
        includeBaseFee: false,
        isRenewal: true,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
      })
    ).toBeNull()
  })

  it('rejects a module that was not on the payment', () => {
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: 0.5,
        includeBaseFee: false,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'AUFENTHALT',
      })
    ).toBeNull()
  })

  it('refunds the full add-on charge when that payment has only one Angabe', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET'] })
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: q.totalChf,
        includeBaseFee: false,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
      })
    ).toBe(q.totalChf)
  })

  it('keeps the base fee when refunding the only Angabe of a first purchase', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: ['BONITAET'] })
    const base = q.lines.find(l => l.kind === 'base')?.amountChf ?? 0
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: q.totalChf,
        includeBaseFee: true,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
      })
    ).toBe(roundSicChf(q.totalChf - base))
  })

  it('splits a bundle across Angaben without refunding the base', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: ALL })
    const shares = ALL.map(
      id =>
        sicModuleRefundAmountChf({
          amountPaidChf: q.totalChf,
          includeBaseFee: true,
          isRenewal: false,
          moduleKinds: ALL,
          moduleKind: id,
        })!
    )
    expect(shares.every(s => s >= 0.01)).toBe(true)
    const refunded = roundSicChf(shares.reduce((sum, n) => sum + n, 0))
    expect(refunded).toBeLessThan(q.totalChf)
    expect(roundSicChf(q.totalChf - refunded)).toBeGreaterThan(0)
  })

  it('caps the share at what Stripe has not yet refunded', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET'] })
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: q.totalChf,
        includeBaseFee: false,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
        alreadyRefundedChf: roundSicChf(q.totalChf - 0.05),
      })
    ).toBe(0.05)
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: q.totalChf,
        includeBaseFee: false,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
        alreadyRefundedChf: q.totalChf,
      })
    ).toBeNull()
  })
})
