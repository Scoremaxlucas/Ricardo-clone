import { getSicModule, SIC_INCOME_NOT_CHECKED_LINE, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'
import { parseSicCalendarDate, sicValidityExpiresAt } from '@/lib/sic/validity'

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

/**
 * Was der Auszug zeigt. Nur «clean» und «none» sind freigabefähig; Verlustscheine
 * wiegen schwerer als offene Betreibungen (ein Gläubiger ist leer ausgegangen).
 */
const PROCEEDINGS = [
  { value: 'clean', label: 'Keine Einträge' },
  { value: 'none', label: 'Keine offenen Betreibungen (frühere erledigt)' },
  { value: 'open', label: 'Offene Betreibungen vermerkt' },
  { value: 'loss', label: 'Verlustscheine vermerkt' },
] as const

/** Zeile auf dem Zertifikat je freigabefähigem Wert — erledigte Einträge werden nicht aufgezählt. */
const PROCEEDINGS_CERT_LINE: Record<string, string> = {
  clean: 'Keine Einträge im Betreibungsregister',
  none: 'Keine offenen Betreibungen',
}

const NOTICE_GIVEN = [
  { value: 'no', label: 'Ungekündigt' },
  { value: 'yes', label: 'Kündigung ausgesprochen' },
] as const

/**
 * Wer (noch) nicht angestellt ist. Für diese Gruppen prüfen wir das Einkommen noch nicht;
 * die Angabe gilt dann als nicht anwendbar statt als fehlend.
 */
export const SIC_INCOME_GROUPS = [
  { value: 'self_employed', label: 'Selbständig erwerbend' },
  { value: 'in_training', label: 'In Ausbildung' },
  { value: 'retired', label: 'Pensioniert' },
] as const

export type SicIncomeGroup = (typeof SIC_INCOME_GROUPS)[number]['value']

export function isSicIncomeGroup(value: unknown): value is SicIncomeGroup {
  return typeof value === 'string' && SIC_INCOME_GROUPS.some(g => g.value === value)
}

export function sicIncomeGroupLabel(value: unknown): string | null {
  return SIC_INCOME_GROUPS.find(g => g.value === value)?.label ?? null
}

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
    {
      key: 'proceedings',
      label: 'Offene Betreibungen',
      kind: 'select',
      required: true,
      options: [...PROCEEDINGS],
      hint: 'Laut Auszug. Verlustscheine oder offene Betreibungen: ablehnen. Bezahlte oder zurückgezogene Einträge: «frühere erledigt».',
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
      key: 'employedUntil',
      label: 'Befristet bis',
      kind: 'date',
      required: false,
      hint: 'Nur bei befristeter Anstellung — dann Pflicht',
    },
    {
      key: 'noticeGiven',
      label: 'Kündigung',
      kind: 'select',
      required: true,
      options: [...NOTICE_GIVEN],
      hint: 'Laut Arbeitgeberbestätigung — «ungekündigt» erscheint nur mit diesem Wert auf dem Zertifikat',
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
      hint: 'Überwiegend = einzelne Verspätungen. Mahnungen, Rückstände, Betreibung oder Kündigung wegen Zahlungsverzug: ablehnen.',
    },
    {
      key: 'referenceDate',
      label: 'Datum der Referenz',
      kind: 'date',
      required: false,
      hint: 'Datum auf dem Formular. Leer = Tag der Freigabe',
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
      {
        key: 'proceedings2',
        label: 'Person 2 — Offene Betreibungen',
        kind: 'select',
        required: true,
        options: [...PROCEEDINGS],
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
        key: 'employedUntil2',
        label: 'Person 2 — Befristet bis',
        kind: 'date',
        required: false,
        hint: 'Nur bei befristeter Anstellung — dann Pflicht',
        group: 'person2',
      },
      {
        key: 'noticeGiven2',
        label: 'Person 2 — Kündigung',
        kind: 'select',
        required: true,
        options: [...NOTICE_GIVEN],
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

/**
 * Paar, nur eine Person angestellt: Für die andere setzt der Prüfer die Gruppe
 * (anhand eines Belegs wie Ausbildungsbestätigung oder Rentenausweis). Ihre
 * Anstellungsfelder entfallen dann, und die 3×-Regel rechnet mit einem Einkommen.
 */
const COUPLE_INCOME_GROUP_FIELDS: Record<'1' | '2', SicFactField> = {
  '1': {
    key: 'incomeGroup',
    label: 'Person 1 — Nicht angestellt',
    kind: 'select',
    required: false,
    options: SIC_INCOME_GROUPS.map(g => ({ value: g.value, label: g.label })),
    hint: 'Nur wenn Person 1 nicht angestellt ist — dann entfallen ihre Lohnfelder',
    group: 'person1',
  },
  '2': {
    key: 'incomeGroup2',
    label: 'Person 2 — Nicht angestellt',
    kind: 'select',
    required: false,
    options: SIC_INCOME_GROUPS.map(g => ({ value: g.value, label: g.label })),
    hint: 'Nur wenn Person 2 nicht angestellt ist — dann entfallen ihre Lohnfelder',
    group: 'person2',
  },
}

const EMPLOYMENT_KEYS = ['incomeBand', 'employmentType', 'employedSince', 'employedUntil', 'noticeGiven', 'employerName']

/** Anstellungsfelder einer Person, die als nicht angestellt erfasst ist. */
function skippedEmploymentKeys(moduleId: SicModuleId, input: Record<string, unknown>, couple: boolean): Set<string> {
  const skip = new Set<string>()
  if (!couple || moduleId !== 'ARBEIT_EINKOMMEN') return skip
  if (isSicIncomeGroup(input.incomeGroup)) EMPLOYMENT_KEYS.forEach(k => skip.add(k))
  if (isSicIncomeGroup(input.incomeGroup2)) EMPLOYMENT_KEYS.forEach(k => skip.add(`${k}2`))
  return skip
}

function knownFactFields(moduleId: SicModuleId): SicFactField[] {
  const byKey = new Map<string, SicFactField>()
  const groupFields = moduleId === 'ARBEIT_EINKOMMEN' ? Object.values(COUPLE_INCOME_GROUP_FIELDS) : []
  for (const field of [...FIELDS[moduleId], ...extraCoupleFields(moduleId), ...groupFields]) {
    byKey.set(field.key, field)
  }
  // Avoid spreading MapIterator in older TS build targets (downlevelIteration).
  return Array.from(byKey.values())
}

export function sicFactFields(moduleId: SicModuleId, opts?: { couple?: boolean }): SicFactField[] {
  if (!opts?.couple) return FIELDS[moduleId]
  const extras = extraCoupleFields(moduleId)
  if (extras.length === 0) return FIELDS[moduleId]
  const arbeit = moduleId === 'ARBEIT_EINKOMMEN'
  return [
    ...(arbeit ? [COUPLE_INCOME_GROUP_FIELDS['1']] : []),
    ...FIELDS[moduleId].map(field => ({
      ...field,
      label: `Person 1 — ${field.label}`,
      group: 'person1' as const,
    })),
    ...(arbeit ? [COUPLE_INCOME_GROUP_FIELDS['2']] : []),
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

  const skipped = skippedEmploymentKeys(moduleId, input, opts?.couple === true)
  for (const field of sicFactFields(moduleId, opts)) {
    if (skipped.has(field.key)) continue
    const value = typeof input[field.key] === 'string' ? (input[field.key] as string).trim() : ''
    if (!value) {
      if (field.required) missing.push(field.label)
      continue
    }
    if (field.kind === 'select' && !field.options?.some(o => o.value === value)) {
      invalid.push(field.label)
      continue
    }
    // Streng YYYY-MM-DD: daraus rechnet die Gültigkeit. Ein lose geparstes Datum
    // fiele dort still auf «Freigabetag + 3 Monate» zurück.
    if (field.kind === 'date' && !parseSicCalendarDate(value)) {
      invalid.push(field.label)
      continue
    }
    facts[field.key] = value.slice(0, 200)
  }

  if (missing.length > 0 || invalid.length > 0) return { ok: false, missing, invalid }
  return { ok: true, facts }
}

/** Werte, die eine Ablehnung verlangen statt einer Freigabe (Regel 1 oben). */
const SIC_NEGATIVE_VALUES: Record<string, readonly string[]> = {
  proceedings: ['open', 'loss'],
  proceedings2: ['open', 'loss'],
  noticeGiven: ['yes'],
  noticeGiven2: ['yes'],
}

function utcToday(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

/**
 * Gründe, warum diese Werte nicht freigegeben werden dürfen. Leer = freigabefähig.
 *
 * - Negativer Inhalt (offene Betreibungen, Verlustscheine, Kündigung) wird abgelehnt, nie gedruckt.
 * - Der Betreibungsauszug darf nicht in der Zukunft liegen und nicht so alt sein,
 *   dass die drei Monate bei der Freigabe schon vorbei wären.
 * - Ein abgelaufener Ausweis wird nicht freigegeben.
 * - Eine befristete Anstellung braucht ihr Enddatum, und es darf nicht vorbei sein.
 */
export function sicApprovalBlockers(moduleId: SicModuleId, facts: SicFacts, now = new Date()): string[] {
  const blockers: string[] = []
  const today = utcToday(now)
  for (const [key, bad] of Object.entries(SIC_NEGATIVE_VALUES)) {
    if (!bad.includes(facts[key])) continue
    const field = fieldFor(moduleId, key)
    if (field) blockers.push(`${optionLabel(field, facts[key])} — bitte ablehnen statt freigeben`)
  }
  if (moduleId === 'AUFENTHALT') {
    for (const key of ['validUntil', 'validUntil2']) {
      const d = parseSicCalendarDate(facts[key])
      // «Gültig bis» auf dem Zertifikat endet um 00:00 dieses Tages — ein Ausweis, der heute endet, trägt nichts mehr.
      if (d && d.getTime() <= today) blockers.push('Der Ausweis ist abgelaufen — bitte ablehnen und den gültigen anfordern')
    }
  }
  if (moduleId === 'ARBEIT_EINKOMMEN' && isSicIncomeGroup(facts.incomeGroup) && isSicIncomeGroup(facts.incomeGroup2)) {
    blockers.push('Beide nicht angestellt — dann im Dossier für den Haushalt «nicht angestellt» vermerken lassen')
  }
  if (moduleId === 'ARBEIT_EINKOMMEN') {
    for (const [type, until] of [
      ['employmentType', 'employedUntil'],
      ['employmentType2', 'employedUntil2'],
    ] as const) {
      if (facts[type] !== 'befristet') continue
      const d = parseSicCalendarDate(facts[until])
      if (!d) blockers.push('Befristete Anstellung: bitte das Enddatum erfassen')
      else if (d.getTime() < today) blockers.push('Die befristete Anstellung ist bereits beendet — bitte ablehnen')
    }
  }
  if (moduleId === 'BONITAET') {
    for (const key of ['extractDate', 'extractDate2']) {
      const d = parseSicCalendarDate(facts[key])
      if (!d) continue
      if (d.getTime() > today) blockers.push('Das Datum des Auszugs liegt in der Zukunft')
      else if (sicValidityExpiresAt(d).getTime() <= now.getTime()) {
        blockers.push('Der Auszug ist älter als drei Monate — bitte ablehnen und einen aktuellen anfordern')
      }
    }
  }
  return Array.from(new Set(blockers))
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
  return `CHF ${Math.round(amount).toLocaleString('de-CH').replace(/[\u00a0']/g, '’')}`
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

/**
 * Feste Formate statt `toLocaleDateString`: Browser formatieren de-CH Monat/Jahr
 * teils als «01/2021», Node als «01.2021». PDF, Prüfseite und Dossier sollen gleich lesen.
 */
function fmtDate(value: string | undefined): string | null {
  const d = parseSicCalendarDate(value)
  if (!d) return null
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`
}

function fmtMonthYear(value: string | undefined): string | null {
  const d = parseSicCalendarDate(value)
  if (!d) return null
  return `${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
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
  const monthPart = (n: number) => (n === 1 ? '1 Monat' : `${n} Monate`)
  if (months < 12) return monthPart(months)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearPart = years === 1 ? '1 Jahr' : `${years} Jahre`
  return rest === 0 ? yearPart : `${yearPart} ${monthPart(rest)}`
}

function fieldFor(moduleId: SicModuleId, key: string): SicFactField | undefined {
  return knownFactFields(moduleId).find(f => f.key === key)
}

function withPerson(label: string | null | undefined, line: string): string {
  const name = (label ?? '').trim()
  return name ? `${name}: ${line}` : line
}

/** Zeilen einer Person — oder des Haushalts (label null). */
export type SicFactGroup = { label: string | null; lines: string[] }

function employmentLines(
  moduleId: SicModuleId,
  facts: SicFacts,
  keys: { band: string; type: string; since: string; until: string; employer: string; notice: string }
): string[] {
  const lines: string[] = []
  // Nur ein gespeicherter Wert erzeugt die Aussage — nie als Default behaupten.
  const notice = facts[keys.notice] === 'no' ? ', ungekündigt' : facts[keys.notice] === 'yes' ? ', Kündigung ausgesprochen' : ''
  const bandField = fieldFor(moduleId, keys.band)
  if (bandField && facts[keys.band]) {
    lines.push(`Bruttojahreslohn ${optionLabel(bandField, facts[keys.band])}`)
  }
  const typeField = fieldFor(moduleId, keys.type)
  const since = fmtMonthYear(facts[keys.since])
  const until = facts[keys.type] === 'befristet' ? fmtMonthYear(facts[keys.until]) : null
  const employer = facts[keys.employer] ? ` bei ${facts[keys.employer]}` : ''
  const period = [since ? ` seit ${since}` : '', until ? `, befristet bis ${until}` : ''].join('')
  if (typeField && facts[keys.type]) {
    // «Befristet angestellt …, befristet bis» wäre doppelt — das Enddatum trägt die Befristung.
    const typeLabel = until ? 'Angestellt' : `${optionLabel(typeField, facts[keys.type])} angestellt`
    lines.push(`${typeLabel}${employer}${period}${notice}`)
  } else if (since || employer) {
    lines.push(`Angestellt${employer}${period}${notice}`)
  }
  return lines
}

function bonitaetLine(facts: SicFacts, suffix: '' | '2'): string[] {
  const lines: string[] = []
  const proceedings = PROCEEDINGS_CERT_LINE[facts[`proceedings${suffix}`] ?? '']
  if (proceedings) lines.push(proceedings)
  const date = fmtDate(facts[`extractDate${suffix}`])
  const office = facts[`office${suffix}`]
  if (date && office) lines.push(`Auszug vom ${date}, ${office}`)
  else if (date) lines.push(`Auszug vom ${date}`)
  else if (office) lines.push(`Auszug vom ${office}`)
  return lines
}

function idLine(moduleId: SicModuleId, facts: SicFacts, suffix: '' | '2'): string[] {
  const typeField = fieldFor(moduleId, `documentType${suffix}`)
  const type = facts[`documentType${suffix}`]
  const until = fmtMonthYear(facts[`validUntil${suffix}`])
  if (typeField && type) {
    const label = optionLabel(typeField, type)
    return [until ? `${label}, gültig bis ${until}` : label]
  }
  return until ? [`Amtlicher Ausweis, gültig bis ${until}`] : []
}

function tenancyLine(facts: SicFacts): string | null {
  const from = fmtMonthYear(facts.tenancyFrom)
  if (!from) return null
  const to = fmtMonthYear(facts.tenancyTo)
  if (to) {
    const duration = tenancyDuration(facts.tenancyFrom, facts.tenancyTo)
    return duration ? `Mietverhältnis ${from} bis ${to} (${duration})` : `Mietverhältnis ${from} bis ${to}`
  }
  // Laufend: «bis heute» stimmt nur am Tag der Referenz. Die Dauer wird bis dorthin gerechnet.
  const asOf = fmtDate(facts.referenceDate)
  if (!asOf) return `Mietverhältnis seit ${from}`
  const duration = tenancyDuration(facts.tenancyFrom, facts.referenceDate)
  return duration ?
      `Mietverhältnis seit ${from} (${duration}, Stand Referenz ${asOf})`
    : `Mietverhältnis seit ${from} (Stand Referenz ${asOf})`
}

/**
 * Baut die Zertifikatszeilen aus den geprüften Werten, gruppiert nach Person.
 * Einzelperson: eine Gruppe ohne Label. Paar: Person 1, Person 2, danach
 * Haushaltszeilen (Label null). Leeres Ergebnis heisst: keine brauchbaren Werte.
 */
export function sicFactGroups(
  moduleId: SicModuleId,
  facts: SicFacts | null,
  opts?: SicFactLineOpts
): SicFactGroup[] {
  if (!facts) return []
  const couple = opts?.couple === true
  const p1 = opts?.person1Label?.trim() || 'Person 1'
  const p2 = opts?.person2Label?.trim() || 'Person 2'
  const groups: SicFactGroup[] = []
  const push = (label: string | null, lines: string[]) => {
    if (lines.length > 0) groups.push({ label, lines })
  }

  if (moduleId === 'BONITAET') {
    if (couple) {
      push(p1, bonitaetLine(facts, ''))
      push(p2, bonitaetLine(facts, '2'))
    } else {
      push(null, bonitaetLine(facts, ''))
    }
  }

  if (moduleId === 'ARBEIT_EINKOMMEN') {
    const k1 = { band: 'incomeBand', type: 'employmentType', since: 'employedSince', until: 'employedUntil', employer: 'employerName', notice: 'noticeGiven' }
    if (couple) {
      const k2 = {
        band: 'incomeBand2',
        type: 'employmentType2',
        since: 'employedSince2',
        until: 'employedUntil2',
        employer: 'employerName2',
        notice: 'noticeGiven2',
      }
      // Eine Person nicht angestellt: ihre Gruppe als Angabe, ihr Einkommen zählt nicht.
      const group1 = sicIncomeGroupLabel(facts.incomeGroup)
      const group2 = sicIncomeGroupLabel(facts.incomeGroup2)
      push(p1, group1 ? [group1, SIC_INCOME_NOT_CHECKED_LINE] : employmentLines(moduleId, facts, k1))
      push(p2, group2 ? [group2, SIC_INCOME_NOT_CHECKED_LINE] : employmentLines(moduleId, facts, k2))
      const band1 = group1 ? undefined : facts.incomeBand
      const band2 = group2 ? undefined : facts.incomeBand2
      const ceiling = sicRentCeilingFromIncomes(band1, band2)
      if (ceiling) {
        const basis = band1 && band2 ? 'beide Einkommen' : `Einkommen ${band1 ? p1 : p2}`
        push(null, [`Richtwert 3×-Regel, ${basis}: Miete bis ${formatSicAmountChf(ceiling)}`])
      }
    } else {
      const lines = employmentLines(moduleId, facts, k1)
      const ceiling = sicRentCeilingChf(facts.incomeBand)
      if (ceiling) lines.push(`Richtwert 3×-Regel: Miete bis ${formatSicAmountChf(ceiling)}`)
      push(null, lines)
    }
  }

  if (moduleId === 'ZUVERLAESSIGKEIT') {
    const lines: string[] = []
    const tenancy = tenancyLine(facts)
    if (tenancy) lines.push(tenancy)
    const behaviourField = fieldFor(moduleId, 'paymentBehaviour')
    if (behaviourField && facts.paymentBehaviour) {
      lines.push(`Miete ${optionLabel(behaviourField, facts.paymentBehaviour).toLowerCase()} bezahlt`)
    }
    // Die Referenz selbst belegt schon das Badge — nur beim Paar sagen, für wen sie gilt.
    if (couple && lines.length > 0) lines.push('Referenz für den gemeinsamen Haushalt')
    push(null, lines)
  }

  if (moduleId === 'AUFENTHALT') {
    if (couple) {
      push(p1, idLine(moduleId, facts, ''))
      push(p2, idLine(moduleId, facts, '2'))
    } else {
      push(null, idLine(moduleId, facts, ''))
    }
  }

  return groups
}

/** Flache Zeilen (Prüfoberfläche, Dossier): beim Paar mit «Name: » davor. */
export function sicFactLines(
  moduleId: SicModuleId,
  facts: SicFacts | null,
  opts?: SicFactLineOpts
): string[] {
  return sicFactGroups(moduleId, facts, opts).flatMap(g => g.lines.map(line => withPerson(g.label, line)))
}

/**
 * Frühestes Ablaufdatum der geprüften Ausweise. Das Zertifikat gilt nicht länger
 * als der Ausweis, auf dem es steht.
 */
export function sicIdValidUntil(facts: SicFacts | null): Date | null {
  if (!facts) return null
  const dates = [parseSicCalendarDate(facts.validUntil), parseSicCalendarDate(facts.validUntil2)].filter(
    (d): d is Date => !!d
  )
  if (dates.length === 0) return null
  return dates.reduce((a, b) => (b.getTime() < a.getTime() ? b : a))
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
  BONITAET: { extractDate: '2026-06-12', office: 'Betreibungsamt Zürich', proceedings: 'clean' },
  ARBEIT_EINKOMMEN: {
    incomeBand: '80_100k',
    employmentType: 'unbefristet',
    employedSince: '2020-03-01',
    noticeGiven: 'no',
  },
  ZUVERLAESSIGKEIT: { tenancyFrom: '2021-01-01', paymentBehaviour: 'always_on_time', referenceDate: '2026-06-08' },
  AUFENTHALT: { documentType: 'ch_pass', validUntil: '2031-05-31' },
}

export function sicCatalogPreviewRows(): { id: SicModuleId; lines: string[] }[] {
  return SIC_MODULES.map(m => m.id).map(id => ({
    id,
    lines: sicFactLines(id, SIC_CERT_PREVIEW_FACTS[id]),
  }))
}

/** Ab so vielen Tagen vor Ablauf darf ein neuer Ausweis eingereicht werden. */
export const SIC_ID_RENEW_WINDOW_DAYS = 60

/**
 * Lohnt sich ein neuer Ausweis? Wenn der geprüfte das Zertifikat kürzt oder
 * innerhalb des Fensters abläuft.
 */
export function sicIdReplacementDue(facts: SicFacts | null, certExpiresAt: Date | null, now = new Date()): boolean {
  const idEnd = sicIdValidUntil(facts)
  if (!idEnd) return false
  if (certExpiresAt && idEnd.getTime() <= certExpiresAt.getTime()) return true
  return idEnd.getTime() - now.getTime() <= SIC_ID_RENEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Geprüfte Werte, die inzwischen nicht mehr stimmen: ein befristeter Vertrag ist
 * beendet, ein Ausweis abgelaufen. Solche Angaben stehen nicht mehr auf dem Dokument.
 */
export function sicFactsLapsed(moduleId: SicModuleId, facts: SicFacts | null, now = new Date()): boolean {
  if (!facts) return false
  if (moduleId === 'AUFENTHALT') {
    const end = sicIdValidUntil(facts)
    return !!end && end.getTime() <= now.getTime()
  }
  if (moduleId === 'ARBEIT_EINKOMMEN') {
    const today = utcToday(now)
    return (
      [
        ['employmentType', 'employedUntil'],
        ['employmentType2', 'employedUntil2'],
      ] as const
    ).some(([type, until]) => {
      if (facts[type] !== 'befristet') return false
      const d = parseSicCalendarDate(facts[until])
      return !!d && d.getTime() < today
    })
  }
  return false
}

/** Ende laut geprüftem Betreibungsauszug (bei zwei Auszügen der ältere), ohne Ausweis-Kappung. */
export function sicExtractValidityEnd(extractFacts: SicFacts | null): Date | null {
  if (!extractFacts) return null
  const dates = [parseSicCalendarDate(extractFacts.extractDate), parseSicCalendarDate(extractFacts.extractDate2)].filter(
    (d): d is Date => !!d
  )
  if (dates.length === 0) return null
  return sicValidityExpiresAt(dates.reduce((a, b) => (b.getTime() < a.getTime() ? b : a)))
}

/**
 * Endet (oder endete) das Zertifikat wegen des Ausweises, während der Auszug noch trägt?
 * Dann hilft ein neuer Ausweis (kostenlos), keine Verlängerung.
 */
export function sicIdCapsExpiry(idFacts: SicFacts | null, extractFacts: SicFacts | null, now = new Date()): boolean {
  const idEnd = sicIdValidUntil(idFacts)
  const extractEnd = sicExtractValidityEnd(extractFacts)
  return !!idEnd && !!extractEnd && idEnd.getTime() < extractEnd.getTime() && extractEnd.getTime() > now.getTime()
}

/**
 * Enthalten die Werte etwas tatsächlich Geprüftes? Eine reine Gruppen-Angabe
 * («nicht angestellt») ist es nicht — sie darf nie als geprüfte Angabe mitgetragen werden.
 */
export function sicHasCheckedFacts(moduleId: SicModuleId, facts: SicFacts | null): boolean {
  if (!facts) return false
  return Object.keys(facts).some(key => key !== 'incomeGroup' && key !== 'incomeGroup2') || moduleId !== 'ARBEIT_EINKOMMEN'
}
