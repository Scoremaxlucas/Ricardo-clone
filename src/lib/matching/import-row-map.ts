import { matchingPropertyWizardSchema, type MatchingPropertyWizardInput } from './property-wizard-schema'

/** Normalisiert Tabellen-Header (Kleinbuchstaben, Trim). */
export function normalizeImportHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Bekannte Spaltennamen (DE/EN) → Wizard-Feldnamen.
 * Erste Zeile der CSV/XLSX soll diese Keys (beliebig gemischt) enthalten.
 */
const HEADER_ALIASES: Record<string, keyof MatchingPropertyWizardInput> = {
  titel: 'title',
  title: 'title',
  objekt: 'title',
  object: 'title',
  beschreibung: 'description',
  description: 'description',
  adresse: 'addressLine',
  address: 'addressLine',
  addressline: 'addressLine',
  address_line: 'addressLine',
  plz: 'zip',
  zip: 'zip',
  ort: 'city',
  city: 'city',
  kanton: 'canton',
  canton: 'canton',
  zimmer: 'rooms',
  rooms: 'rooms',
  m2: 'areaSqm',
  flaeche: 'areaSqm',
  fläche: 'areaSqm',
  areasqm: 'areaSqm',
  area_sqm: 'areaSqm',
  stockwerk: 'floor',
  etage: 'floor',
  floor: 'floor',
  miete: 'rentPerMonth',
  miete_chf: 'rentPerMonth',
  rent: 'rentPerMonth',
  rentpermonth: 'rentPerMonth',
  rent_per_month: 'rentPerMonth',
  ab: 'availableFrom',
  verfuegbar_ab: 'availableFrom',
  verfügbar_ab: 'availableFrom',
  availablefrom: 'availableFrom',
  available_from: 'availableFrom',
  bis: 'availableTo',
  availableto: 'availableTo',
  available_to: 'availableTo',
  haustier_hinweis: 'petPolicyNote',
  petpolicynote: 'petPolicyNote',
  pet_policy_note: 'petPolicyNote',
  haustiere: 'allowPets',
  allowpets: 'allowPets',
  allow_pets: 'allowPets',
  status: 'status',
}

function parseLooseDate(raw: string): Date | undefined {
  const s = raw.trim()
  if (!s) return undefined
  const iso = Date.parse(s)
  if (!Number.isNaN(iso)) return new Date(iso)
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) {
    const d = Number.parseInt(m[1], 10)
    const mo = Number.parseInt(m[2], 10) - 1
    const y = Number.parseInt(m[3], 10)
    return new Date(y, mo, d)
  }
  return undefined
}

function parseLooseBool(raw: string): boolean | undefined {
  const x = raw.trim().toLowerCase()
  if (['ja', 'yes', 'true', '1', 'y', 'wahr'].includes(x)) return true
  if (['nein', 'no', 'false', '0', 'n', 'falsch'].includes(x)) return false
  return undefined
}

function normalizeStatus(raw: string): 'draft' | 'active' | undefined {
  const x = raw.trim().toLowerCase()
  if (['draft', 'entwurf', 'd'].includes(x)) return 'draft'
  if (['active', 'aktiv', 'published', 'live', 'a'].includes(x)) return 'active'
  return undefined
}

/**
 * Mappt eine flache Zeile (Header → String-Wert) auf ein Rohobjekt für `matchingPropertyWizardSchema`.
 */
export function flatRowToWizardRaw(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [header, cell] of Object.entries(row)) {
    const key = HEADER_ALIASES[normalizeImportHeader(header)]
    if (!key) continue
    const v = cell == null ? '' : String(cell).trim()

    if (key === 'allowPets') {
      const b = parseLooseBool(v)
      if (b !== undefined) out.allowPets = b
      continue
    }
    if (key === 'status') {
      const st = normalizeStatus(v)
      if (st) out.status = st
      continue
    }
    if (key === 'availableFrom' || key === 'availableTo') {
      const d = parseLooseDate(v)
      if (d) out[key] = d
      continue
    }

    if (v === '') continue
    out[key] = v
  }

  if (out.status == null) out.status = 'draft'
  if (out.allowPets == null) out.allowPets = true

  return out
}

export type RowParseResult =
  | { ok: true; data: MatchingPropertyWizardInput }
  | { ok: false; message: string }

export function parseWizardRowFromFlat(row: Record<string, string>): RowParseResult {
  const raw = flatRowToWizardRaw(row)
  const parsed = matchingPropertyWizardSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first?.path?.length ? String(first.path[0]) : 'row'
    return { ok: false, message: `${path}: ${first?.message ?? 'Ungültig'}` }
  }
  return { ok: true, data: parsed.data }
}
