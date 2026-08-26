import { describe, expect, it } from 'vitest'
import {
  generateSicCertificateCode,
  isValidSicCertificateCode,
  normalizeSicCertificateCode,
} from '@/lib/sic/certificate-code'
import { normalizeSicModuleIds, SIC_BASE_FEE_CHF, SIC_BUNDLE_ALL_MODULES_CHF, SIC_MODULE_FEE_CHF, SIC_MODULES, sicBundleSavingsChf } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { isSicLandlordPdfReady } from '@/lib/sic/dossier'
import { addCalendarMonths, isSicExpired, sicExtendedExpiresAt, sicValidityExpiresAt } from '@/lib/sic/validity'

describe('certificate code', () => {
  it('generates a valid SIC code', () => {
    const code = generateSicCertificateCode(2026)
    expect(code).toMatch(/^SIC-2026-[A-Z2-9]{8}$/)
    expect(isValidSicCertificateCode(code)).toBe(true)
  })
  it('normalizes and validates', () => {
    expect(normalizeSicCertificateCode('  sic-2026-abcdefgh ')).toBe('SIC-2026-ABCDEFGH')
    expect(isValidSicCertificateCode('sic-2026-abcdefgh')).toBe(true)
  })
  it('rejects wrong prefix / format', () => {
    expect(isValidSicCertificateCode('HLV-2026-ABCDEFGH')).toBe(false)
    expect(isValidSicCertificateCode('SIC-2026-ABC')).toBe(false)
    expect(isValidSicCertificateCode(null)).toBe(false)
  })
  it('excludes confusable chars', () => {
    const code = generateSicCertificateCode(2026)
    expect(code.slice(9)).not.toMatch(/[01OI]/)
  })
})

describe('module normalization', () => {
  it('keeps only valid ids, dedupes, fixed order', () => {
    expect(normalizeSicModuleIds(['AUFENTHALT', 'BONITAET', 'BONITAET', 'garbage'])).toEqual([
      'BONITAET',
      'AUFENTHALT',
    ])
  })
  it('handles non-array', () => {
    expect(normalizeSicModuleIds(undefined)).toEqual([])
    expect(normalizeSicModuleIds('BONITAET')).toEqual([])
  })
})

describe('pricing', () => {
  it('base fee + no modules', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: [] })
    expect(q.totalChf).toBe(SIC_BASE_FEE_CHF)
    expect(q.lines).toHaveLength(1)
  })
  it('full certificate (base + all 4 modules) is currently free (bundle)', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: SIC_MODULES.map(m => m.id) })
    const fullPrice = SIC_BASE_FEE_CHF + 4 * SIC_MODULE_FEE_CHF
    expect(q.totalChf).toBe(SIC_BUNDLE_ALL_MODULES_CHF)
    if (fullPrice > SIC_BUNDLE_ALL_MODULES_CHF) {
      expect(q.lines.some(l => l.kind === 'discount' && l.amountChf === SIC_BUNDLE_ALL_MODULES_CHF - fullPrice)).toBe(true)
    }
  })
  it('all 4 modules as add-on (no base fee) → no bundle discount', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: SIC_MODULES.map(m => m.id) })
    expect(q.totalChf).toBe(4 * SIC_MODULE_FEE_CHF)
    expect(q.lines.some(l => l.kind === 'discount')).toBe(false)
  })
  it('add-on purchase without base fee', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET', 'AUFENTHALT'] })
    expect(q.totalChf).toBe(2 * SIC_MODULE_FEE_CHF)
    expect(q.includeBaseFee).toBe(false)
  })
  it('bundle savings is 0 while fees are 0 (no fake discount)', () => {
    expect(sicBundleSavingsChf()).toBe(0)
  })
  it('Arbeit & Einkommen has no Mietverhältnis', () => {
    const arbeit = SIC_MODULES.find(m => m.id === 'ARBEIT_EINKOMMEN')
    expect(arbeit?.scopeItems.join(' ')).not.toMatch(/Mietverhältnis/)
    expect(arbeit?.requiredDocuments.join(' ')).not.toMatch(/Mietverhältnis/)
    expect(arbeit?.landlordQuestion).not.toMatch(/Miete tragen/)
  })
  it('Aufenthalt does not claim a right to live here', () => {
    const auf = SIC_MODULES.find(m => m.id === 'AUFENTHALT')
    expect(auf?.landlordQuestion).not.toMatch(/Darf er hier wohnen/)
  })
  it('ignores invalid module ids in total', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET', 'nope'] })
    expect(q.totalChf).toBe(SIC_MODULE_FEE_CHF)
  })
})

describe('validity', () => {
  it('adds 3 calendar months', () => {
    const from = new Date(Date.UTC(2026, 0, 15, 12, 0, 0))
    expect(sicValidityExpiresAt(from).toISOString().slice(0, 10)).toBe('2026-04-15')
  })
  it('handles month overflow (31 Jan +1 month)', () => {
    const from = new Date(Date.UTC(2026, 0, 31, 12, 0, 0))
    // +3 months from Jan 31 → Apr 30 (Apr has 30 days)
    expect(sicValidityExpiresAt(from).toISOString().slice(0, 10)).toBe('2026-04-30')
  })
  it('extension never shortens existing validity', () => {
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
    const farFuture = new Date(Date.UTC(2027, 0, 1, 0, 0, 0))
    expect(sicExtendedExpiresAt(farFuture, now).getTime()).toBe(farFuture.getTime())
  })
  it('extension refreshes when current is sooner', () => {
    const now = new Date(Date.UTC(2026, 5, 1, 0, 0, 0))
    const soon = new Date(Date.UTC(2026, 5, 10, 0, 0, 0))
    expect(sicExtendedExpiresAt(soon, now).toISOString().slice(0, 10)).toBe('2026-09-01')
  })
  it('isSicExpired', () => {
    const now = new Date(Date.UTC(2026, 5, 1))
    expect(isSicExpired(new Date(Date.UTC(2026, 4, 1)), now)).toBe(true)
    expect(isSicExpired(new Date(Date.UTC(2026, 6, 1)), now)).toBe(false)
    expect(isSicExpired(null, now)).toBe(true)
  })
  it('addCalendarMonths is pure', () => {
    const from = new Date(Date.UTC(2026, 0, 15))
    addCalendarMonths(from, 3)
    expect(from.toISOString().slice(0, 10)).toBe('2026-01-15')
  })
})

describe('module wording', () => {
  it('keeps titles free of product jargon', () => {
    const titles = SIC_MODULES.map(m => m.title).join(' · ')
    expect(titles).not.toMatch(/Bonität|Zuverlässigkeit|Modul/)
  })
  it('keeps the hand-in line short enough for one card line', () => {
    for (const m of SIC_MODULES) {
      expect(m.youUpload.length).toBeLessThanOrEqual(60)
    }
  })
})

describe('landlord PDF gate', () => {
  const future = new Date(Date.now() + 86_400_000)
  it('requires all purchased modules VERIFIED plus holder name', () => {
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: future,
        modules: [{ status: 'VERIFIED' }, { status: 'PENDING_DOCS' }],
      })
    ).toBe(false)
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: future,
        modules: [{ status: 'VERIFIED' }, { status: 'VERIFIED' }],
      })
    ).toBe(true)
  })
  it('rejects empty modules or missing name', () => {
    expect(
      isSicLandlordPdfReady({
        holderName: null,
        status: 'ACTIVE',
        expiresAt: future,
        modules: [{ status: 'VERIFIED' }],
      })
    ).toBe(false)
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: future,
        modules: [],
      })
    ).toBe(false)
  })
})
