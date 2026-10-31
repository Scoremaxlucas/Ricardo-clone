import { SIC_RENEWAL_FEE_CHF } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { isSicRenewalPending, modulesResetByRenewal, sicRenewalCarriesFacts } from '@/lib/sic/renewal'
import { describe, expect, it } from 'vitest'

const NOW = new Date(Date.UTC(2026, 7, 1))

describe('modulesResetByRenewal', () => {
  it('verlangt immer einen frischen Betreibungsauszug', () => {
    const reset = modulesResetByRenewal(
      [{ moduleKind: 'BONITAET', status: 'VERIFIED', reviewedAt: NOW }],
      NOW
    )
    expect(reset).toEqual(['BONITAET'])
  })

  it('lässt eine kürzlich geprüfte Arbeitsstelle stehen', () => {
    const reset = modulesResetByRenewal(
      [{ moduleKind: 'ARBEIT_EINKOMMEN', status: 'VERIFIED', reviewedAt: new Date(Date.UTC(2026, 4, 1)) }],
      NOW
    )
    expect(reset).toEqual([])
  })

  it('verlangt die Arbeitsstelle neu, wenn die Prüfung über ein Jahr alt ist', () => {
    const reset = modulesResetByRenewal(
      [{ moduleKind: 'ARBEIT_EINKOMMEN', status: 'VERIFIED', reviewedAt: new Date(Date.UTC(2025, 0, 1)) }],
      NOW
    )
    expect(reset).toEqual(['ARBEIT_EINKOMMEN'])
  })

  it('verlangt den Ausweis nur neu, wenn er abgelaufen ist', () => {
    const valid = modulesResetByRenewal(
      [
        {
          moduleKind: 'AUFENTHALT',
          status: 'VERIFIED',
          reviewedAt: NOW,
          verifiedFacts: { documentType: 'permit_b', validUntil: '2030-01-01' },
        },
      ],
      NOW
    )
    expect(valid).toEqual([])

    const expired = modulesResetByRenewal(
      [
        {
          moduleKind: 'AUFENTHALT',
          status: 'VERIFIED',
          reviewedAt: NOW,
          verifiedFacts: { documentType: 'permit_b', validUntil: '2026-05-01' },
        },
      ],
      NOW
    )
    expect(expired).toEqual(['AUFENTHALT'])
  })

  it('lässt die Vermieter-Referenz dauerhaft stehen', () => {
    const reset = modulesResetByRenewal(
      [{ moduleKind: 'ZUVERLAESSIGKEIT', status: 'VERIFIED', reviewedAt: new Date(Date.UTC(2020, 0, 1)) }],
      NOW
    )
    expect(reset).toEqual([])
  })
})

describe('Verlängerung im Preis', () => {
  it('verrechnet die Pauschale ohne Basisgebühr', () => {
    const quote = quoteSicOrder({ includeBaseFee: true, moduleIds: [], isRenewal: true })
    expect(quote.isRenewal).toBe(true)
    expect(quote.includeBaseFee).toBe(false)
    expect(quote.lines.some(l => l.kind === 'base')).toBe(false)
    const renewalLine = quote.lines.find(l => l.kind === 'renewal')
    expect(renewalLine?.amountChf).toBe(SIC_RENEWAL_FEE_CHF)
  })

  it('gibt bei einer Verlängerung keinen Bundle-Rabatt', () => {
    const quote = quoteSicOrder({
      includeBaseFee: true,
      moduleIds: ['BONITAET', 'ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT', 'AUFENTHALT'],
      isRenewal: true,
    })
    expect(quote.lines.some(l => l.kind === 'discount')).toBe(false)
  })
})

describe('isSicRenewalPending', () => {
  const verifiedAt = new Date(Date.UTC(2026, 5, 1))
  const paidAfter = new Date(Date.UTC(2026, 7, 1))

  it('läuft, solange nach der Zahlung kein neuer Auszug freigegeben ist', () => {
    expect(
      isSicRenewalPending({ bonitaetStatus: 'PENDING_DOCS', lastBonitaetVerifiedAt: verifiedAt, renewalPaidAts: [paidAfter] })
    ).toBe(true)
    expect(
      isSicRenewalPending({ bonitaetStatus: 'REJECTED', lastBonitaetVerifiedAt: verifiedAt, renewalPaidAts: [paidAfter] })
    ).toBe(true)
  })

  it('endet mit der Freigabe des neuen Auszugs', () => {
    expect(
      isSicRenewalPending({ bonitaetStatus: 'VERIFIED', lastBonitaetVerifiedAt: paidAfter, renewalPaidAts: [paidAfter] })
    ).toBe(false)
  })

  it('zählt alte, bereits abgeschlossene Verlängerungen nicht', () => {
    const oldRenewal = new Date(Date.UTC(2026, 2, 1))
    expect(
      isSicRenewalPending({ bonitaetStatus: 'PENDING_DOCS', lastBonitaetVerifiedAt: verifiedAt, renewalPaidAts: [oldRenewal] })
    ).toBe(false)
    expect(isSicRenewalPending({ bonitaetStatus: 'PENDING_DOCS', lastBonitaetVerifiedAt: null, renewalPaidAts: [] })).toBe(
      false
    )
  })
})

describe('isSicRenewalPending ohne Betreibungs-Angabe', () => {
  it('blockiert keine Verlängerung, wenn der Auszug erstattet wurde', () => {
    expect(
      isSicRenewalPending({ bonitaetStatus: null, lastBonitaetVerifiedAt: null, renewalPaidAts: [new Date()] })
    ).toBe(false)
  })
})

describe('sicRenewalCarriesFacts', () => {
  it('behält Auszug und Arbeit bis zur neuen Prüfung, nie einen abgelaufenen Ausweis', () => {
    expect(sicRenewalCarriesFacts('BONITAET')).toBe(true)
    expect(sicRenewalCarriesFacts('ARBEIT_EINKOMMEN')).toBe(true)
    expect(sicRenewalCarriesFacts('AUFENTHALT')).toBe(false)
  })
})
