import { getSicModule, type SicModuleId } from '@/lib/sic/modules'

/**
 * Geprüfte Werte je Modul — die Substanz des Zertifikats.
 *
 * Zwei Regeln bestimmen, welche Felder hier stehen:
 *
 * 1. Ein inhaltlich negativer Nachweis führt zur Ablehnung, nicht zu einer
 *    negativen Zeile. «Freigegeben» bedeutet deshalb bereits: keine offenen
 *    Betreibungen, ungekündigt, Referenz positiv. Erfasst wird nur, was der
 *    Vermieter daraus nicht ableiten kann.
 * 2. Ausgegeben werden Kategorien statt Rohwerte. Der Vermieter erfährt das
 *    Einkommensband, nicht den Lohn.
 */

export type SicFactFieldKind = 'text' | 'date' | 'select'

export type SicFactField = {
  key: string
  label: string
  kind: SicFactFieldKind
  required: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  /** Woher der Prüfer den Wert nimmt. */
  hint?: string
}

export type SicFacts = Record<string, string>

/** Bruttojahreslohn als Band. `lowerChf` trägt die Mietplafond-Berechnung. */
export const SIC_INCOME_BANDS: readonly { value: string; label: string; lowerChf: number | null }[] = [
  { value: 'lt_40k', label: 'unter CHF 40’000', lowerChf: null },
  { value: '40_60k', label: 'CHF 40’000 – 60’000', lowerChf: 40_000 },
  { value: '60_80k', label: 'CHF 60’000 – 80’000', lowerChf: 60_000 },
  { value: '80_100k', label: 'CHF 80’000 – 100’000', lowerChf: 80_000 },
  { value: '100_130k', label: 'CHF 100’000 – 130’000', lowerChf: 100_000 },
  { value: '130_180k', label: 'CHF 130’000 – 180’000', lowerChf: 130_000 },
  { value: 'gte_180k', label: 'über CHF 180’000', lowerChf: 180_000 },
] as const

const EMPLOYMENT_TYPES = [
  { value: 'unbefristet', label: 'Unbefristet' },
  { value: 'befristet', label: 'Befristet' },
  { value: 'probezeit', label: 'In der Probezeit' },
] as const

const PAYMENT_BEHAVIOUR = [
  { value: 'always_on_time', label: 'Stets fristgerecht' },
  { value: 'mostly_on_time', label: 'Überwiegend fristgerecht' },
] as const

const ID_DOCUMENT_TYPES = [
  { value: 'ch_pass', label: 'Schweizer Pass' },
  { value: 'ch_id', label: 'Schweizer Identitätskarte' },
  { value: 'permit_c', label: 'Aufenthaltsbewilligung C' },
  { value: 'permit_b', label: 'Aufenthaltsbewilligung B' },
  { value: 'permit_l', label: 'Kurzaufenthaltsbewilligung L' },
  { value: 'other', label: 'Anderer amtlicher Ausweis' },
] as const

const FIELDS: Record<SicModuleId, SicFactField[]> = {
  BONITAET: [
    {
      key: 'extractDate',
      label: 'Datum des Auszugs',
      kind: 'date',
      required: true,
      hint: 'Ausstellungsdatum auf dem Auszug',
    },
    {
      key: 'office',
      label: 'Ausstellendes Betreibungsamt',
      kind: 'text',
      required: true,
      placeholder: 'Betreibungsamt Zürich',
    },
  ],
  ARBEIT_EINKOMMEN: [
    {
      key: 'incomeBand',
      label: 'Bruttojahreslohn (Band)',
      kind: 'select',
      required: true,
      options: SIC_INCOME_BANDS.map(b => ({ value: b.value, label: b.label })),
      hint: 'Aus Arbeitgeberbestätigung und Lohnabrechnung',
    },
    {
      key: 'employmentType',
      label: 'Anstellungsart',
      kind: 'select',
      required: true,
      options: [...EMPLOYMENT_TYPES],
    },
    {
      key: 'employedSince',
      label: 'Anstellung seit',
      kind: 'date',
      required: true,
    },
    {
      key: 'employerName',
      label: 'Arbeitgeber',
      kind: 'text',
      required: false,
      placeholder: 'Muster AG',
      hint: 'Optional — erscheint auf dem Zertifikat',
    },
  ],
  ZUVERLAESSIGKEIT: [
    {
      key: 'tenancyFrom',
      label: 'Mietbeginn',
      kind: 'date',
      required: true,
    },
    {
      key: 'tenancyTo',
      label: 'Mietende',
      kind: 'date',
      required: false,
      hint: 'Leer lassen, wenn das Mietverhältnis noch läuft',
    },
    {
      key: 'paymentBehaviour',
      label: 'Zahlungsverhalten',
      kind: 'select',
      required: true,
      options: [...PAYMENT_BEHAVIOUR],
    },
  ],
  AUFENTHALT: [
    {
      key: 'documentType',
      label: 'Ausweisart',
      kind: 'select',
      required: true,
      options: [...ID_DOCUMENT_TYPES],
    },
    {
      key: 'validUntil',
      label: 'Gültig bis',
      kind: 'date',
      required: false,
      hint: 'Leer lassen, wenn der Ausweis kein Ablaufdatum trägt',
    },
  ],
}

export function sicFactFields(moduleId: SicModuleId): SicFactField[] {
  return FIELDS[moduleId]
}

function optionLabel(field: SicFactField, value: string): string {
  return field.options?.find(o => o.value === value)?.label ?? value
}

/**
 * Prüft und säubert eingereichte Werte. Unbekannte Schlüssel werden verworfen,
 * Select-Werte müssen aus der Liste stammen, Daten müssen parsebar sein.
 */
export function normalizeSicFacts(
  moduleId: SicModuleId,
  raw: unknown
): { ok: true; facts: SicFacts } | { ok: false; missing: string[]; invalid: string[] } {
  const input = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>
  const facts: SicFacts = {}
  const missing: string[] = []
  const invalid: string[] = []

  for (const field of sicFactFields(moduleId)) {
    const value = typeof input[field.key] === 'string' ? (input[field.key] as string).trim() : ''
    if (!value) {
      if (field.required) missing.push(field.label)
      continue
    }
    if (field.kind === 'select' && !field.options?.some(o => o.value === value)) {
      invalid.push(field.label)
      continue
    }
    if (field.kind === 'date' && Number.isNaN(new Date(value).getTime())) {
      invalid.push(field.label)
      continue
    }
    facts[field.key] = value.slice(0, 200)
  }

  if (missing.length > 0 || invalid.length > 0) return { ok: false, missing, invalid }
  return { ok: true, facts }
}

/** Aus Json-Spalte gelesene Werte auf bekannte String-Felder reduzieren. */
export function readSicFacts(moduleId: SicModuleId, stored: unknown): SicFacts | null {
  if (!stored || typeof stored !== 'object') return null
  const input = stored as Record<string, unknown>
  const facts: SicFacts = {}
  for (const field of sicFactFields(moduleId)) {
    const v = input[field.key]
    if (typeof v === 'string' && v.trim()) facts[field.key] = v.trim()
  }
  return Object.keys(facts).length > 0 ? facts : null
}

export function formatSicAmountChf(amount: number): string {
  return `CHF ${Math.round(amount).toLocaleString('de-CH').replace(/\u00a0/g, '’')}`
}

/**
 * Mietplafond nach der 3×-Regel, gerechnet aus dem **unteren** Bandrand —
 * die Aussage soll nie optimistischer sein als der Nachweis.
 * Abgerundet auf 50 Franken.
 */
export function sicRentCeilingChf(incomeBand: string | undefined): number | null {
  const band = SIC_INCOME_BANDS.find(b => b.value === incomeBand)
  if (!band?.lowerChf) return null
  const monthly = band.lowerChf / 12 / 3
  return Math.floor(monthly / 50) * 50
}

function fmtDate(value: string | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtMonthYear(value: string | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-CH', { month: '2-digit', year: 'numeric' })
}

function tenancyDuration(from: string | undefined, to: string | undefined): string | null {
  if (!from) return null
  const start = new Date(from)
  const end = to ? new Date(to) : new Date()
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const months = Math.max(
    0,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth())
  )
  if (months < 12) return `${months} Monate`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearPart = years === 1 ? '1 Jahr' : `${years} Jahre`
  return rest === 0 ? yearPart : `${yearPart} ${rest} Monate`
}

function fieldFor(moduleId: SicModuleId, key: string): SicFactField | undefined {
  return sicFactFields(moduleId).find(f => f.key === key)
}

/**
 * Baut die Zertifikatszeilen aus den geprüften Werten.
 * Leeres Ergebnis heisst: keine brauchbaren Werte erfasst — Aufrufer fällt
 * dann auf die generischen Zeilen aus `modules.ts` zurück.
 */
export function sicFactLines(moduleId: SicModuleId, facts: SicFacts | null): string[] {
  if (!facts) return []
  const lines: string[] = []

  if (moduleId === 'BONITAET') {
    lines.push('Keine offenen Betreibungen')
    const date = fmtDate(facts.extractDate)
    const office = facts.office
    if (date && office) lines.push(`Auszug vom ${date}, ${office}`)
    else if (date) lines.push(`Auszug vom ${date}`)
    else if (office) lines.push(`Auszug vom ${office}`)
  }

  if (moduleId === 'ARBEIT_EINKOMMEN') {
    const bandField = fieldFor(moduleId, 'incomeBand')
    if (bandField && facts.incomeBand) {
      lines.push(`Bruttojahreslohn ${optionLabel(bandField, facts.incomeBand)}`)
    }
    const typeField = fieldFor(moduleId, 'employmentType')
    const since = fmtMonthYear(facts.employedSince)
    if (typeField && facts.employmentType) {
      const typeLabel = optionLabel(typeField, facts.employmentType)
      lines.push(since ? `${typeLabel} angestellt seit ${since}, ungekündigt` : `${typeLabel} angestellt, ungekündigt`)
    } else if (since) {
      lines.push(`Angestellt seit ${since}, ungekündigt`)
    }
    if (facts.employerName) lines.push(`Arbeitgeber: ${facts.employerName}`)
    const ceiling = sicRentCeilingChf(facts.incomeBand)
    if (ceiling) {
      lines.push(`Tragbar bis ${formatSicAmountChf(ceiling)} Monatsmiete (3×-Regel)`)
    }
  }

  if (moduleId === 'ZUVERLAESSIGKEIT') {
    const from = fmtMonthYear(facts.tenancyFrom)
    const to = fmtMonthYear(facts.tenancyTo)
    const duration = tenancyDuration(facts.tenancyFrom, facts.tenancyTo)
    if (from) {
      const period = to ? `${from} bis ${to}` : `${from} bis heute`
      lines.push(duration ? `Mietverhältnis ${period} (${duration})` : `Mietverhältnis ${period}`)
    }
    const behaviourField = fieldFor(moduleId, 'paymentBehaviour')
    if (behaviourField && facts.paymentBehaviour) {
      lines.push(`Miete ${optionLabel(behaviourField, facts.paymentBehaviour).toLowerCase()} bezahlt`)
    }
    lines.push('Referenz des bisherigen Vermieters liegt vor')
  }

  if (moduleId === 'AUFENTHALT') {
    const typeField = fieldFor(moduleId, 'documentType')
    const until = fmtMonthYear(facts.validUntil)
    if (typeField && facts.documentType) {
      const label = optionLabel(typeField, facts.documentType)
      lines.push(until ? `${label}, gültig bis ${until}` : label)
    } else if (until) {
      lines.push(`Amtlicher Ausweis, gültig bis ${until}`)
    }
  }

  return lines
}

/** Ist der Ausweis abgelaufen? Steuert, ob eine Verlängerung ihn zurücksetzt. */
export function isSicIdDocumentExpired(facts: SicFacts | null, now = new Date()): boolean {
  if (!facts?.validUntil) return false
  const d = new Date(facts.validUntil)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() <= now.getTime()
}

/** Kurzform für die Prüfoberfläche: «Betreibungsauszug — 2 Werte erfasst». */
export function sicFactSummary(moduleId: SicModuleId, facts: SicFacts | null): string {
  const filled = facts ? Object.keys(facts).length : 0
  const total = sicFactFields(moduleId).length
  return `${getSicModule(moduleId).title} — ${filled} von ${total} Werten erfasst`
}
