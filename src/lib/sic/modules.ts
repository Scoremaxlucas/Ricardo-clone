/**
 * Swiss Immo Cert (SIC) — Produktdefinition.
 *
 * Modulares Mieter-Zertifikat: Basisgebühr erstellt das Zertifikat, jedes Modul
 * verifiziert zusätzliche Angaben. Nur bezahlte + freigegebene Module erscheinen
 * als «VERIFIZIERT». Preise/Gültigkeit gemäss Produktvorgabe.
 *
 * Diese Datei ist die Single Source of Truth für Preise und Modulinhalte.
 */

export const SIC_CURRENCY = 'CHF' as const

/** Einmalige Einschreibegebühr: erstellt das Zertifikat (ohne Module = keine Verifizierung). */
export const SIC_BASE_FEE_CHF = 20

/** Preis pro verifiziertem Modul. */
export const SIC_MODULE_FEE_CHF = 30

/** Komplett-Paket: Basis + alle 4 Module zum Bundle-Preis (statt 140). */
export const SIC_BUNDLE_ALL_MODULES_CHF = 120

/** Gültigkeit eines Zertifikats bzw. einer Verlängerung in Kalendermonaten. */
export const SIC_VALIDITY_MONTHS = 3

export type SicModuleId = 'BONITAET' | 'ARBEIT_EINKOMMEN' | 'ZUVERLAESSIGKEIT' | 'AUFENTHALT'

export type SicModuleDefinition = {
  id: SicModuleId
  /** Reihenfolge auf Zertifikat/Checkout. */
  order: number
  title: string
  /** Kurzbeschreibung des Prüfumfangs. */
  summary: string
  /** Einzelne verifizierte Zeilen, die dieses Modul auf dem Zertifikat erzeugt. */
  lineItems: string[]
  /** Vom Nutzer benötigte Nachweise (für Upload-Schritt). */
  requiredDocuments: string[]
  priceChf: number
}

export const SIC_MODULES: readonly SicModuleDefinition[] = [
  {
    id: 'BONITAET',
    order: 1,
    title: 'Bonität',
    summary: 'Wir prüfen deine Bonitätsunterlagen und verifizieren sie.',
    lineItems: ['Betreibungsauszug eingereicht und geprüft'],
    requiredDocuments: ['Aktueller Betreibungsregisterauszug (max. 3 Monate alt)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ARBEIT_EINKOMMEN',
    order: 2,
    title: 'Arbeit & Einkommen',
    summary: 'Wir prüfen deine Arbeits- und Einkommensnachweise und verifizieren sie.',
    lineItems: [
      'Einkommensnachweis eingereicht und geprüft',
      'Arbeitsverhältnis (schriftliche Arbeitgeberbestätigung geprüft)',
      'Arbeitgeberdauer (Nachweis geprüft)',
      'Aktuelles Mietverhältnis (schriftlicher Nachweis geprüft)',
    ],
    requiredDocuments: [
      'Lohnnachweis / Lohnausweis (Selbst-Upload)',
      'Arbeitgeberbestätigung — SIC-Formular digital ausfüllen & unterschreiben lassen',
      'Nachweis aktuelles Mietverhältnis (Selbst-Upload)',
    ],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ZUVERLAESSIGKEIT',
    order: 3,
    title: 'Zuverlässigkeit',
    summary: 'Wir prüfen deine Referenz- und Ausweisdokumente und verifizieren sie.',
    lineItems: ['Vermieterreferenz (Referenzschreiben eingereicht und geprüft)'],
    requiredDocuments: [
      'Vermieter-Referenz — SIC-Formular digital ausfüllen & unterschreiben lassen',
    ],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'AUFENTHALT',
    order: 4,
    title: 'Aufenthaltsstatus',
    summary: 'Wir prüfen deinen Aufenthaltsstatus und verifizieren ihn.',
    lineItems: ['Aufenthaltsstatus (entsprechender Nachweis geprüft)'],
    requiredDocuments: ['Pass / ID (CH) oder gültige Aufenthaltsbewilligung (C, B, L)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
] as const

const MODULE_BY_ID: Record<SicModuleId, SicModuleDefinition> = SIC_MODULES.reduce(
  (acc, m) => {
    acc[m.id] = m
    return acc
  },
  {} as Record<SicModuleId, SicModuleDefinition>
)

export function isSicModuleId(value: unknown): value is SicModuleId {
  return typeof value === 'string' && value in MODULE_BY_ID
}

export function getSicModule(id: SicModuleId): SicModuleDefinition {
  return MODULE_BY_ID[id]
}

/** Eingehende (evtl. unsaubere) Modul-Liste normalisieren: nur gültige IDs, dedupliziert, in fixer Reihenfolge. */
export function normalizeSicModuleIds(raw: unknown): SicModuleId[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<SicModuleId>()
  for (const v of raw) {
    if (isSicModuleId(v)) seen.add(v)
  }
  return SIC_MODULES.filter(m => seen.has(m.id)).map(m => m.id)
}
