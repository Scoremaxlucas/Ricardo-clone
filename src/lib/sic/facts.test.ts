import {
  normalizeSicFacts,
  readSicFacts,
  sicCatalogPreviewRows,
  sicFactFields,
  sicFactLines,
  sicRentCeilingChf,
  isSicIdDocumentExpired,
} from '@/lib/sic/facts'
import { describe, expect, it } from 'vitest'

describe('normalizeSicFacts', () => {
  it('nimmt vollständige Angaben an und verwirft unbekannte Schlüssel', () => {
    const res = normalizeSicFacts('BONITAET', {
      extractDate: '2026-06-12',
      office: ' Betreibungsamt Zürich ',
      sneaky: 'ignoriert',
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.facts).toEqual({ extractDate: '2026-06-12', office: 'Betreibungsamt Zürich' })
  })

  it('meldet fehlende Pflichtfelder mit Klartext-Label', () => {
    const res = normalizeSicFacts('BONITAET', { extractDate: '2026-06-12' })
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.missing).toContain('Ausstellendes Betreibungsamt')
  })

  it('weist Select-Werte ausserhalb der Liste und unlesbare Daten ab', () => {
    const res = normalizeSicFacts('ARBEIT_EINKOMMEN', {
      incomeBand: 'phantasieband',
      employmentType: 'unbefristet',
      employedSince: 'irgendwann',
    })
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.invalid).toEqual(
      expect.arrayContaining(['Bruttojahreslohn (Band)', 'Anstellung seit'])
    )
  })

  it('lässt optionale Felder leer durchgehen', () => {
    const res = normalizeSicFacts('AUFENTHALT', { documentType: 'ch_pass' })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.facts.validUntil).toBeUndefined()
  })
})

describe('readSicFacts', () => {
  it('liest nur bekannte Felder aus der Json-Spalte', () => {
    expect(readSicFacts('AUFENTHALT', { documentType: 'permit_b', fremd: 'x' })).toEqual({
      documentType: 'permit_b',
    })
  })
  it('gibt null zurück, wenn nichts Brauchbares gespeichert ist', () => {
    expect(readSicFacts('AUFENTHALT', null)).toBeNull()
    expect(readSicFacts('AUFENTHALT', { fremd: 'x' })).toBeNull()
  })
})

describe('sicRentCeilingChf', () => {
  it('rechnet vom unteren Bandrand, abgerundet auf 50 Franken', () => {
    // 60'000 / 12 / 3 = 1666.67 → 1650
    expect(sicRentCeilingChf('60_80k')).toBe(1650)
    expect(sicRentCeilingChf('100_130k')).toBe(2750)
  })
  it('gibt für das offene unterste Band keinen Plafond aus', () => {
    expect(sicRentCeilingChf('lt_40k')).toBeNull()
    expect(sicRentCeilingChf(undefined)).toBeNull()
  })
})

describe('sicFactLines', () => {
  it('nennt den Betreibungsauszug mit Datum und Amt', () => {
    const lines = sicFactLines('BONITAET', { extractDate: '2026-06-12', office: 'Betreibungsamt Zürich' })
    expect(lines[0]).toBe('Keine offenen Betreibungen')
    expect(lines[1]).toContain('Betreibungsamt Zürich')
  })

  it('zeigt Einkommensband und tragbare Miete, nie den exakten Lohn', () => {
    const lines = sicFactLines('ARBEIT_EINKOMMEN', {
      incomeBand: '80_100k',
      employmentType: 'unbefristet',
      employedSince: '2020-03-01',
      employerName: 'Muster AG',
    })
    expect(lines.join(' | ')).toContain('CHF 80’000 – 100’000')
    expect(lines.join(' | ')).toContain('Tragbar bis CHF 2’200 Monatsmiete')
    expect(lines.join(' | ')).toContain('ungekündigt')
  })

  it('liefert ohne Werte keine Zeilen, damit der Aufrufer generisch zurückfällt', () => {
    expect(sicFactLines('ARBEIT_EINKOMMEN', null)).toEqual([])
  })

  it('keeps landing/FAQ preview inside real bands and 3× ceilings', () => {
    const blob = sicCatalogPreviewRows()
      .flatMap(r => r.lines)
      .join(' ')
    expect(blob).toContain('CHF 80’000 – 100’000')
    expect(blob).toContain('CHF 2’200')
    expect(blob).not.toMatch(/90.?000/)
    expect(blob).not.toMatch(/2.?500/)
    expect(blob).not.toMatch(/110.?000/)
  })

  it('formuliert die Vermieter-Referenz ohne Negativurteil', () => {
    const lines = sicFactLines('ZUVERLAESSIGKEIT', {
      tenancyFrom: '2021-01-01',
      paymentBehaviour: 'always_on_time',
    })
    expect(lines.join(' | ')).toMatch(/Mietverhältnis/)
    expect(lines.join(' | ')).not.toMatch(/nicht|negativ|Problem/i)
  })
})

describe('isSicIdDocumentExpired', () => {
  const now = new Date(Date.UTC(2026, 7, 1))
  it('erkennt einen abgelaufenen Ausweis', () => {
    expect(isSicIdDocumentExpired({ documentType: 'permit_b', validUntil: '2026-05-01' }, now)).toBe(true)
  })
  it('behandelt einen Ausweis ohne Ablaufdatum als gültig', () => {
    expect(isSicIdDocumentExpired({ documentType: 'ch_pass' }, now)).toBe(false)
    expect(isSicIdDocumentExpired(null, now)).toBe(false)
  })
})

describe('Feldkatalog', () => {
  it('hält für jedes Modul mindestens ein Pflichtfeld bereit', () => {
    for (const id of ['BONITAET', 'ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT', 'AUFENTHALT'] as const) {
      expect(sicFactFields(id).some(f => f.required)).toBe(true)
    }
  })
})
