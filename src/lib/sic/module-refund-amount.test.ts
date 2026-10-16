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

  it('refunds the whole payment when it covered a single Angabe', () => {
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: 30,
        includeBaseFee: false,
        isRenewal: false,
        moduleKinds: ['BONITAET'],
        moduleKind: 'BONITAET',
      })
    ).toBe(30)
  })

  it('splits the package price equally across its Angaben (CHF 79 → 19.75 each)', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: ALL })
    expect(q.totalChf).toBe(79)
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
    expect(shares).toEqual([19.75, 19.75, 19.75, 19.75])
    expect(roundSicChf(shares.reduce((sum, n) => sum + n, 0))).toBe(q.totalChf)
  })

  it('rounds the share to Rappen', () => {
    expect(
      sicModuleRefundAmountChf({
        amountPaidChf: 10,
        includeBaseFee: true,
        isRenewal: false,
        moduleKinds: ['BONITAET', 'AUFENTHALT', 'ARBEIT_EINKOMMEN'],
        moduleKind: 'AUFENTHALT',
      })
    ).toBe(3.33)
  })

  it('caps the share at what Stripe has not yet refunded', () => {
    const q = { totalChf: 30 }
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
