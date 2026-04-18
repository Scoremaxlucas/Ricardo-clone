import { describe, expect, it } from 'vitest'
import { parseMatchingImportCsvText } from './import-parse'
import { flatRowToWizardRaw, normalizeImportHeader, parseWizardRowFromFlat } from './import-row-map'

describe('normalizeImportHeader', () => {
  it('trims and lowercases', () => {
    expect(normalizeImportHeader('  PLZ  ')).toBe('plz')
  })
})

describe('parseWizardRowFromFlat', () => {
  it('accepts German headers and Swiss date', () => {
    const row: Record<string, string> = {
      titel: 'Schöne Wohnung Seefeld',
      plz: '8008',
      ort: 'Zürich',
      kanton: 'zh',
      zimmer: '4.5',
      miete: '3500',
      ab: '01.06.2026',
      status: 'Entwurf',
    }
    const r = parseWizardRowFromFlat(row)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.title).toContain('Seefeld')
      expect(r.data.zip).toBe('8008')
      expect(r.data.canton).toBe('ZH')
      expect(r.data.rentPerMonth).toBe(3500)
      expect(r.data.status).toBe('draft')
    }
  })

  it('maps flatRowToWizardRaw allowPets', () => {
    const raw = flatRowToWizardRaw({ haustiere: 'nein' })
    expect(raw.allowPets).toBe(false)
  })
})

describe('parseMatchingImportCsvText', () => {
  it('parses header and one row', () => {
    const csv = 'titel,plz,ort,kanton,zimmer,miete,ab,status\nTestobjekt,3000,Bern,BE,3,1500,2026-01-15,draft\n'
    const rows = parseMatchingImportCsvText(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].titel).toBe('Testobjekt')
    const r = parseWizardRowFromFlat(rows[0])
    expect(r.ok).toBe(true)
  })
})
