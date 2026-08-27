import { describe, expect, it } from 'vitest'
import {
  generateSicCertificateCode,
  isValidSicCertificateCode,
  normalizeSicCertificateCode,
} from '@/lib/sic/certificate-code'
import {
  formatSicChf,
  normalizeSicModuleIds,
  roundSicChf,
  SIC_BASE_FEE_CHF,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MIN_CHARGE_CHF,
  SIC_MODULE_FEE_CHF,
  SIC_MODULES,
  sicBundleSavingsChf,
} from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { isSicLandlordPdfReady, joinHolderName, encodePaymentHolderName, decodePaymentHolderName } from '@/lib/sic/dossier'
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

/** Erwarteter Betrag: unter dem Stripe-Minimum wird aufs Minimum angehoben. */
function chargeable(rawChf: number): number {
  return rawChf > 0 && rawChf < SIC_MIN_CHARGE_CHF ? SIC_MIN_CHARGE_CHF : roundSicChf(rawChf)
}

describe('pricing', () => {
  it('base fee + no modules', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: [] })
    expect(q.totalChf).toBe(chargeable(SIC_BASE_FEE_CHF))
    expect(q.lines.filter(l => l.kind === 'base')).toHaveLength(1)
    expect(q.lines.some(l => l.kind === 'module')).toBe(false)
  })
  it('full certificate (base + all 4 modules) costs the bundle price', () => {
    const q = quoteSicOrder({ includeBaseFee: true, moduleIds: SIC_MODULES.map(m => m.id) })
    const fullPrice = roundSicChf(SIC_BASE_FEE_CHF + 4 * SIC_MODULE_FEE_CHF)
    expect(q.totalChf).toBe(chargeable(SIC_BUNDLE_ALL_MODULES_CHF))
    if (fullPrice > SIC_BUNDLE_ALL_MODULES_CHF) {
      expect(q.lines.some(l => l.kind === 'discount' && l.amountChf === SIC_BUNDLE_ALL_MODULES_CHF - fullPrice)).toBe(true)
    }
  })
  it('all 4 modules as add-on (no base fee) → no bundle discount', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: SIC_MODULES.map(m => m.id) })
    expect(q.totalChf).toBe(chargeable(4 * SIC_MODULE_FEE_CHF))
    expect(q.lines.some(l => l.kind === 'discount')).toBe(false)
  })
  it('add-on purchase without base fee', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET', 'AUFENTHALT'] })
    expect(q.totalChf).toBe(chargeable(2 * SIC_MODULE_FEE_CHF))
    expect(q.includeBaseFee).toBe(false)
  })
  it('bundle savings is 0 while the bundle equals the single prices (no fake discount)', () => {
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
    expect(q.moduleIds).toEqual(['BONITAET'])
    expect(q.lines.filter(l => l.kind === 'module')).toHaveLength(1)
    expect(q.totalChf).toBe(chargeable(SIC_MODULE_FEE_CHF))
  })
})

describe('Stripe-Mindestbetrag', () => {
  it('hebt Beträge unter dem Minimum sichtbar an', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: ['BONITAET'] })
    if (SIC_MODULE_FEE_CHF > 0 && SIC_MODULE_FEE_CHF < SIC_MIN_CHARGE_CHF) {
      const topUp = q.lines.find(l => l.kind === 'minimum')
      expect(topUp?.amountChf).toBe(roundSicChf(SIC_MIN_CHARGE_CHF - SIC_MODULE_FEE_CHF))
      expect(q.totalChf).toBe(SIC_MIN_CHARGE_CHF)
    }
    // Angezeigte Summe muss immer der Summe der Zeilen entsprechen.
    expect(roundSicChf(q.lines.reduce((s, l) => s + l.amountChf, 0))).toBe(q.totalChf)
  })
  it('lässt Total 0 unangetastet (kein Stripe-Durchlauf)', () => {
    const q = quoteSicOrder({ includeBaseFee: false, moduleIds: [] })
    expect(q.totalChf).toBe(0)
    expect(q.lines.some(l => l.kind === 'minimum')).toBe(false)
  })
})

describe('Preisanzeige', () => {
  it('zeigt Rappen mit zwei Stellen, ganze Franken ohne', () => {
    expect(formatSicChf(0)).toBe('Kostenlos')
    expect(formatSicChf(0.1)).toBe('CHF 0.10')
    expect(formatSicChf(0.5)).toBe('CHF 0.50')
    expect(formatSicChf(30)).toBe('CHF 30.–')
  })
  it('rundet Float-Reste auf Rappen', () => {
    expect(roundSicChf(0.1 + 0.1 + 0.1)).toBe(0.3)
    expect(roundSicChf(0.1 * 4 + 0.1)).toBe(0.5)
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
  })
  it('treats a certificate without expiry as not yet issued, not as expired', () => {
    // expiresAt bleibt null bis zur ersten Freigabe — die Uhr läuft noch nicht.
    expect(isSicExpired(null, new Date(Date.UTC(2026, 5, 1)))).toBe(false)
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
  it('gibt das Teil-Zertifikat ab der ersten Freigabe frei', () => {
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: future,
        modules: [{ status: 'VERIFIED' }, { status: 'PENDING_DOCS' }],
      })
    ).toBe(true)
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
  it('sperrt das PDF ohne freigegebene Angabe und ohne Gültigkeit', () => {
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: future,
        modules: [{ status: 'PENDING_DOCS' }, { status: 'IN_REVIEW' }],
      })
    ).toBe(false)
    // Bezahlt, aber noch nichts freigegeben: expiresAt ist null.
    expect(
      isSicLandlordPdfReady({
        holderName: 'Anna Muster',
        status: 'ACTIVE',
        expiresAt: null,
        modules: [{ status: 'VERIFIED' }],
      })
    ).toBe(false)
  })
})

describe('holder name', () => {
  it('joins only when both parts exist', () => {
    expect(joinHolderName('Anna', 'Muster')).toBe('Anna Muster')
    expect(joinHolderName('Lara', '')).toBeNull()
    expect(joinHolderName('Lara', null)).toBeNull()
    expect(joinHolderName(null, 'Muster')).toBeNull()
  })

  it('round-trips compound first names without splitting on space', () => {
    const stored = encodePaymentHolderName('Anna Maria', 'de la Cruz')
    expect(decodePaymentHolderName(stored)).toEqual({ firstName: 'Anna Maria', lastName: 'de la Cruz' })
  })

  it('still reads legacy space-separated checkout names', () => {
    expect(decodePaymentHolderName('Anna Muster')).toEqual({ firstName: 'Anna', lastName: 'Muster' })
    expect(decodePaymentHolderName('Lara')).toEqual({ firstName: 'Lara', lastName: '' })
  })
})
