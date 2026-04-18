import Papa from 'papaparse'
import * as XLSX from 'xlsx'

function rowArrayToRecord(headers: string[], cells: unknown[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]?.trim()
    if (!h) continue
    const c = cells[i]
    out[h] = c == null || c === '' ? '' : String(c).trim()
  }
  return out
}

/** CSV-Text → Zeilen als flache Records (erste Zeile = Header). */
export function parseMatchingImportCsvText(text: string): Record<string, string>[] {
  const res = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
  })
  const data = res.data
  if (!data.length) return []
  const headers = (data[0] || []).map(c => String(c ?? '').trim())
  const rows: Record<string, string>[] = []
  for (let r = 1; r < data.length; r++) {
    const rec = rowArrayToRecord(headers, data[r] || [])
    if (Object.keys(rec).length === 0) continue
    const allEmpty = Object.values(rec).every(v => v === '')
    if (allEmpty) continue
    rows.push(rec)
  }
  return rows
}

/** Erstes Arbeitsblatt einer .xlsx-Datei → gleiche Zeilenstruktur wie CSV. */
export function parseMatchingImportXlsxBuffer(buffer: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]
  if (!matrix.length) return []
  const headers = (matrix[0] || []).map(c => String(c ?? '').trim())
  const rows: Record<string, string>[] = []
  for (let r = 1; r < matrix.length; r++) {
    const rec = rowArrayToRecord(headers, matrix[r] || [])
    if (Object.keys(rec).length === 0) continue
    const allEmpty = Object.values(rec).every(v => v === '')
    if (allEmpty) continue
    rows.push(rec)
  }
  return rows
}
