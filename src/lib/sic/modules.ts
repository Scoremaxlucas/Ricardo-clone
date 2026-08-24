/**
 * Swiss Immo Cert (SIC) — Produktdefinition.
 *
 * Modulares Mieter-Zertifikat: Basisgebühr erstellt das Zertifikat, jedes Modul
 * beantwortet eine konkrete Frage des Vermieters. Nur bezahlte + freigegebene
 * Module erscheinen als «VERIFIZIERT».
 *
 * Diese Datei ist die Single Source of Truth für Preise und Modulinhalte.
 */

export const SIC_CURRENCY = 'CHF' as const

/**
 * Aktuell kostenlos (Einführung). Stripe-Checkout wird bei Total 0 übersprungen.
 * Produktion wiederherstellen: Basis 20 / Modul 30 / Bundle 120.
 */
export const SIC_BASE_FEE_CHF = 0

/** Preis pro verifiziertem Modul. */
export const SIC_MODULE_FEE_CHF = 0

/** Komplett-Paket: Basis + alle 4 Module zum Bundle-Preis. */
export const SIC_BUNDLE_ALL_MODULES_CHF = 0

/** Gültigkeit eines Zertifikats bzw. einer Verlängerung in Kalendermonaten. */
export const SIC_VALIDITY_MONTHS = 3

export type SicModuleId = 'BONITAET' | 'ARBEIT_EINKOMMEN' | 'ZUVERLAESSIGKEIT' | 'AUFENTHALT'

export type SicModuleDefinition = {
  id: SicModuleId
  /** Reihenfolge auf Zertifikat/Checkout. */
  order: number
  title: string
  /** Kurz: was wir mit den Belegen tun (Dossier, FAQ). */
  summary: string
  /** Frage, die der Vermieter damit beantwortet bekommt. */
  landlordQuestion: string
  /** Was auf dem Zertifikat für ihn steht — Nutzen in einem Satz. */
  landlordSees: string
  /** Was du einreichst. */
  youUpload: string
  /** Prüfumfang für Checklisten — ohne «geprüft». */
  scopeItems: string[]
  /** Verifizierte Zeilen auf dem Zertifikat-PDF (nur nach Freigabe). */
  lineItems: string[]
  /** Vom Nutzer benötigte Nachweise (für Upload-Checklist). */
  requiredDocuments: string[]
  priceChf: number
}

export const SIC_MODULES: readonly SicModuleDefinition[] = [
  {
    id: 'BONITAET',
    order: 1,
    title: 'Bonität',
    summary:
      'Wir prüfen deine eingereichten Bonitätsnachweise auf Vollständigkeit und Plausibilität. Nach erfolgreicher Prüfung steht das Modul auf dem Zertifikat als «Verifiziert».',
    landlordQuestion: 'Gibt es Betreibungen?',
    landlordSees: 'Er sieht auf einen Blick, ob ein geprüfter Betreibungsauszug vorliegt — ohne das PDF selbst zu suchen.',
    youUpload: 'Aktueller Betreibungsauszug (nicht älter als 3 Monate)',
    scopeItems: ['Betreibungsauszug'],
    lineItems: ['Betreibungsauszug eingereicht und geprüft'],
    requiredDocuments: ['Aktueller Betreibungsregisterauszug (max. 3 Monate alt)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ARBEIT_EINKOMMEN',
    order: 2,
    title: 'Arbeit & Einkommen',
    summary:
      'Wir prüfen deine eingereichten Lohn- und Arbeitsnachweise auf Vollständigkeit und Plausibilität. Nach erfolgreicher Prüfung steht das Modul auf dem Zertifikat als «Verifiziert».',
    landlordQuestion: 'Liegt ein belegtes Einkommen vor?',
    landlordSees: 'Er sieht Einkommen und Arbeitsverhältnis in einer Zeile — statt Lohnabrechnung und Vertrag einzeln zu öffnen.',
    youUpload: 'Lohnausweis oder Lohnabrechnung plus Arbeitgeberbestätigung (SIC-Formular)',
    scopeItems: [
      'Einkommensnachweis',
      'Arbeitsverhältnis (Arbeitgeberbestätigung)',
      'Arbeitgeberdauer',
    ],
    lineItems: [
      'Einkommensnachweis eingereicht und geprüft',
      'Arbeitsverhältnis (schriftliche Arbeitgeberbestätigung geprüft)',
      'Arbeitgeberdauer (Nachweis geprüft)',
    ],
    requiredDocuments: [
      'Lohnnachweis / Lohnausweis (Selbst-Upload)',
      'Arbeitgeberbestätigung — SIC-PDF-Formular vom Arbeitgeber ausfüllen und unterzeichnen lassen',
    ],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ZUVERLAESSIGKEIT',
    order: 3,
    title: 'Wohnen & Vermieterreferenz',
    summary:
      'Wir prüfen die eingereichte Vermieterreferenz auf Vollständigkeit und Plausibilität. Nach erfolgreicher Prüfung steht das Modul auf dem Zertifikat als «Verifiziert».',
    landlordQuestion: 'War er als Mieter in Ordnung?',
    landlordSees: 'Er sieht eine geprüfte Referenz des bisherigen Vermieters — ohne selbst anrufen zu müssen.',
    youUpload: 'Vermieter-Referenz auf dem SIC-Formular, vom bisherigen Vermieter unterzeichnet',
    scopeItems: ['Vermieterreferenz'],
    lineItems: ['Vermieterreferenz (Referenzschreiben eingereicht und geprüft)'],
    requiredDocuments: [
      'Vermieter-Referenz — SIC-PDF-Formular vom Vermieter ausfüllen und unterzeichnen lassen',
    ],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'AUFENTHALT',
    order: 4,
    title: 'Aufenthalt',
    summary:
      'Wir prüfen deinen eingereichten Ausweis oder die Bewilligung auf Vollständigkeit und Plausibilität. Nach erfolgreicher Prüfung steht das Modul auf dem Zertifikat als «Verifiziert».',
    landlordQuestion: 'Ist Ausweis oder Bewilligung belegt?',
    landlordSees: 'Er sieht, dass Identität und Aufenthaltsstatus mit einem geprüften Ausweis belegt sind.',
    youUpload: 'Pass oder ID (Schweiz) oder gültige Aufenthaltsbewilligung (C, B, L)',
    scopeItems: ['Pass / ID oder Aufenthaltsbewilligung'],
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

/** Katalogpreis einzeln: Basis + jedes Modul zum Einzelpreis. */
export function sicCatalogListTotalChf(): number {
  return SIC_BASE_FEE_CHF + SIC_MODULES.reduce((sum, m) => sum + m.priceChf, 0)
}

/**
 * Ersparnis Komplett-Paket gegenüber einzeln.
 * 0 in der kostenlosen Einführungsphase — UI darf dann keinen Rabatt vortäuschen.
 */
export function sicBundleSavingsChf(): number {
  return Math.max(0, sicCatalogListTotalChf() - SIC_BUNDLE_ALL_MODULES_CHF)
}
