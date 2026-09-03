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
  /** Paar-Zertifikat: Person 1 oder 2 — steuert die Admin-Abschnitte. */
  group?: 'person1' | 'person2'
}

export type SicFacts = Record<string, string>

export type SicFactLineOpts = {
  couple?: boolean
  person1Label?: string | null
  person2Label?: string | null
}

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

function extraCoupleFields(moduleId: SicModuleId): SicFactField[] {
  if (moduleId === 'BONITAET') {
    return [
      {
        key: 'extractDate2',
        label: 'Person 2 — Datum des Auszugs',
        kind: 'date',
        required: true,
        hint: 'Ausstellungsdatum auf dem zweiten Auszug',
        group: 'person2',
      },
      {
        key: 'office2',
        label: 'Person 2 — Ausstellendes Betreibungsamt',
        kind: 'text',
        required: true,
        placeholder: 'Betreibungsamt Bern',
        group: 'person2',
      },
    ]
  }
  if (moduleId === 'ARBEIT_EINKOMMEN') {
    return [
      {
        key: 'incomeBand2',
        label: 'Person 2 — Bruttojahreslohn (Band)',
        kind: 'select',
        required: true,
        options: SIC_INCOME_BANDS.map(b => ({ value: b.value, label: b.label })),
        group: 'person2',
      },
      {
        key: 'employmentType2',
        label: 'Person 2 — Anstellungsart',
        kind: 'select',
        required: true,
        options: [...EMPLOYMENT_TYPES],
        group: 'person2',
      },
      {
        key: 'employedSince2',
        label: 'Person 2 — Anstellung seit',
        kind: 'date',
        required: true,
        group: 'person2',
      },
      {
        key: 'employerName2',
        label: 'Person 2 — Arbeitgeber',
        kind: 'text',
        required: false,
        placeholder: 'Muster AG',
        group: 'person2',
      },
    ]
  }
  if (moduleId === 'AUFENTHALT') {
    return [
      {
        key: 'documentType2',
        label: 'Person 2 — Ausweisart',
        kind: 'select',
        required: true,
        options: [...ID_DOCUMENT_TYPES],
        group: 'person2',
      },
      {
        key: 'validUntil2',
        label: 'Person 2 — Gültig bis',
        kind: 'date',
        required: false,
        hint: 'Leer lassen, wenn der Ausweis kein Ablaufdatum trägt',
        group: 'person2',
      },
    ]
  }
  return []
}

function knownFactFields(moduleId: SicModuleId): SicFactField[] {
  const byKey = new Map<string, SicFactField>()
  for (const field of [...FIELDS[moduleId], ...extraCoupleFields(moduleId)]) {
    byKey.set(field.key, field)
  }
  // Avoid spreading MapIterator in older TS build targets (downlevelIteration).
  return Array.from(byKey.values())
}

export function sicFactFields(moduleId: SicModuleId, opts?: { couple?: boolean }): SicFactField[] {
  if (!opts?.couple) return FIELDS[moduleId]
  const extras = extraCoupleFields(moduleId)
  if (extras.length === 0) return FIELDS[moduleId]
  return [
    ...FIELDS[moduleId].map(field => ({
      ...field,
      label: `Person 1 — ${field.label}`,
      group: 'person1' as const,
    })),
    ...extras,
  ]
}

/** Module mit getrennten Person-1/2-Feldern — nicht die Haushalts-Referenz. */
export function sicModuleHasCouplePersonFacts(moduleId: SicModuleId): boolean {
  return extraCoupleFields(moduleId).length > 0
}

/**
 * Der Parser liefert immer Person-1-Schlüssel. Beim Paar muss das zweite
 * Dokument auf *2 gelegt werden, sonst überschreibt Auslesen Person 1.
 */
export function remapSicPrefillToPerson(moduleId: SicModuleId, facts: SicFacts, person: 1 | 2): SicFacts {
  const extras = extraCoupleFields(moduleId)
  if (person === 1) {
    const person2Keys = new Set(extras.map(f => f.key))
    const out: SicFacts = {}
    for (const [key, value] of Object.entries(facts)) {
      if (!person2Keys.has(key)) out[key] = value
    }
    return out
  }
  const out: SicFacts = {}
  for (const field of extras) {
    const sourceKey = field.key.endsWith('2') ? field.key.slice(0, -1) : field.key
    const value = facts[sourceKey]
    if (value !== undefined) out[field.key] = value
  }
  return out
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
  raw: unknown,
  opts?: { couple?: boolean }
): { ok: true; facts: SicFacts } | { ok: false; missing: string[]; invalid: string[] } {
  const input = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>
  const facts: SicFacts = {}
  const missing: string[] = []
  const invalid: string[] = []

  for (const field of sicFactFields(moduleId, opts)) {
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
  for (const field of knownFactFields(moduleId)) {
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
  return sicRentCeilingFromIncomes(incomeBand)
}

/**
 * 3×-Regel für eine oder zwei Personen: Summe der unteren Bandränder,
 * nie optimistischer als die Nachweise. Abgerundet auf 50 Franken.
 */
export function sicRentCeilingFromIncomes(
  band: string | undefined,
  band2?: string | undefined
): number | null {
  const lowers = [band, band2]
    .map(value => SIC_INCOME_BANDS.find(b => b.value === value)?.lowerChf)
    .filter((n): n is number => typeof n === 'number')
  if (lowers.length === 0) return null
  const monthly = lowers.reduce((sum, n) => sum + n, 0) / 12 / 3
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
  return knownFactFields(moduleId).find(f => f.key === key)
}

function withPerson(label: string | null | undefined, line: string): string {
  const name = (label ?? '').trim()
  return name ? `${name}: ${line}` : line
}

function employmentLines(
  moduleId: SicModuleId,
  facts: SicFacts,
  keys: { band: string; type: string; since: string; employer: string },
  personLabel?: string | null
): string[] {
  const lines: string[] = []
  const bandField = fieldFor(moduleId, keys.band)
  if (bandField && facts[keys.band]) {
    lines.push(withPerson(personLabel, `Bruttojahreslohn ${optionLabel(bandField, facts[keys.band])}`))
  }
  const typeField = fieldFor(moduleId, keys.type)
  const since = fmtMonthYear(facts[keys.since])
  if (typeField && facts[keys.type]) {
    const typeLabel = optionLabel(typeField, facts[keys.type])
    lines.push(
      withPerson(
        personLabel,
        since ? `${typeLabel} angestellt seit ${since}, ungekündigt` : `${typeLabel} angestellt, ungekündigt`
      )
    )
  } else if (since) {
    lines.push(withPerson(personLabel, `Angestellt seit ${since}, ungekündigt`))
  }
  if (facts[keys.employer]) lines.push(withPerson(personLabel, `Arbeitgeber: ${facts[keys.employer]}`))
  return lines
}

/**
 * Baut die Zertifikatszeilen aus den geprüften Werten.
 * Leeres Ergebnis heisst: keine brauchbaren Werte erfasst — Aufrufer fällt
 * dann auf die generischen Zeilen aus `modules.ts` zurück.
 */
export function sicFactLines(
  moduleId: SicModuleId,
  facts: SicFacts | null,
  opts?: SicFactLineOpts
): string[] {
  if (!facts) return []
  const lines: string[] = []
  const couple = opts?.couple === true
  const p1 = opts?.person1Label?.trim() || null
  const p2 = opts?.person2Label?.trim() || null

  if (moduleId === 'BONITAET') {
    lines.push('Keine offenen Betreibungen')
    const date = fmtDate(facts.extractDate)
    const office = facts.office
    let first = ''
    if (date && office) first = `Auszug vom ${date}, ${office}`
    else if (date) first = `Auszug vom ${date}`
    else if (office) first = `Auszug vom ${office}`
    if (first) lines.push(couple ? withPerson(p1, first) : first)
    if (couple) {
      const date2 = fmtDate(facts.extractDate2)
      const office2 = facts.office2
      let second = ''
      if (date2 && office2) second = `Auszug vom ${date2}, ${office2}`
      else if (date2) second = `Auszug vom ${date2}`
      else if (office2) second = `Auszug vom ${office2}`
      if (second) lines.push(withPerson(p2, second))
    }
  }

  if (moduleId === 'ARBEIT_EINKOMMEN') {
    if (couple) {
      lines.push(
        ...employmentLines(
          moduleId,
          facts,
          { band: 'incomeBand', type: 'employmentType', since: 'employedSince', employer: 'employerName' },
          p1
        )
      )
      lines.push(
        ...employmentLines(
          moduleId,
          facts,
          { band: 'incomeBand2', type: 'employmentType2', since: 'employedSince2', employer: 'employerName2' },
          p2
        )
      )
      const ceiling = sicRentCeilingFromIncomes(facts.incomeBand, facts.incomeBand2)
      if (ceiling) {
        lines.push(`Tragbar bis ${formatSicAmountChf(ceiling)} Monatsmiete (3×-Regel, beide Einkommen)`)
      }
    } else {
      lines.push(
        ...employmentLines(moduleId, facts, {
          band: 'incomeBand',
          type: 'employmentType',
          since: 'employedSince',
          employer: 'employerName',
        })
      )
      const ceiling = sicRentCeilingChf(facts.incomeBand)
      if (ceiling) {
        lines.push(`Tragbar bis ${formatSicAmountChf(ceiling)} Monatsmiete (3×-Regel)`)
      }
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
    lines.push(
      couple ? 'Referenz des bisherigen Vermieters liegt vor (Haushalt)' : 'Referenz des bisherigen Vermieters liegt vor'
    )
  }

  if (moduleId === 'AUFENTHALT') {
    const typeField = fieldFor(moduleId, 'documentType')
    const until = fmtMonthYear(facts.validUntil)
    if (typeField && facts.documentType) {
      const label = optionLabel(typeField, facts.documentType)
      const line = until ? `${label}, gültig bis ${until}` : label
      lines.push(couple ? withPerson(p1, line) : line)
    } else if (until) {
      lines.push(couple ? withPerson(p1, `Amtlicher Ausweis, gültig bis ${until}`) : `Amtlicher Ausweis, gültig bis ${until}`)
    }
    if (couple) {
      const typeField2 = fieldFor(moduleId, 'documentType2')
      const until2 = fmtMonthYear(facts.validUntil2)
      if (typeField2 && facts.documentType2) {
        const label = optionLabel(typeField2, facts.documentType2)
        const line = until2 ? `${label}, gültig bis ${until2}` : label
        lines.push(withPerson(p2, line))
      } else if (until2) {
        lines.push(withPerson(p2, `Amtlicher Ausweis, gültig bis ${until2}`))
      }
    }
  }

  return lines
}

/** Ist der Ausweis abgelaufen? Steuert, ob eine Verlängerung ihn zurücksetzt. */
export function isSicIdDocumentExpired(facts: SicFacts | null, now = new Date()): boolean {
  if (!facts) return false
  for (const key of ['validUntil', 'validUntil2'] as const) {
    const raw = facts[key]
    if (!raw) continue
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    if (d.getTime() <= now.getTime()) return true
  }
  return false
}

/** Kurzform für die Prüfoberfläche: «Betreibungsauszug — 2 Werte erfasst». */
export function sicFactSummary(moduleId: SicModuleId, facts: SicFacts | null): string {
  const filled = facts ? Object.keys(facts).length : 0
  const total = sicFactFields(moduleId).length
  return `${getSicModule(moduleId).title} — ${filled} von ${total} Werten erfasst`
}

/**
 * Beispielwerte für Landing/FAQ — dieselben Bänder und 3×-Zahlen wie auf dem PDF.
 * Keine erfundenen Intervalle wie «90–110k».
 */
export const SIC_CERT_PREVIEW_FACTS: Record<SicModuleId, SicFacts> = {
  BONITAET: { extractDate: '2026-06-12', office: 'Betreibungsamt Zürich' },
  ARBEIT_EINKOMMEN: {
    incomeBand: '80_100k',
    employmentType: 'unbefristet',
    employedSince: '2020-03-01',
  },
  ZUVERLAESSIGKEIT: { tenancyFrom: '2021-01-01', paymentBehaviour: 'always_on_time' },
  AUFENTHALT: { documentType: 'ch_pass', validUntil: '2031-05-31' },
}

export function sicCatalogPreviewRows(): { id: SicModuleId; lines: string[] }[] {
  return (['BONITAET', 'ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT', 'AUFENTHALT'] as const).map(id => ({
    id,
    lines: sicFactLines(id, SIC_CERT_PREVIEW_FACTS[id]),
  }))
}
