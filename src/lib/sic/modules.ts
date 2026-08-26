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
  /** Titel in Alltagssprache: das Dokument, das jeder Mieter kennt — keine Fachbegriffe. */
  title: string
  /** Kurz und ohne Fachwort: was das Dokument zeigt (Dossier, FAQ). */
  summary: string
  /** Frage des Vermieters, in Du-Form — für Vorlese-Labels und Produktarbeit. */
  landlordQuestion: string
  /** Was der Vermieter dadurch sieht (Dossier). */
  landlordSees: string
  /** Was du einreichst — eine kurze Zeile, die auf eine Karte passt. */
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
    title: 'Betreibungsauszug',
    summary: 'Der Auszug vom Betreibungsamt zeigt, ob offene Betreibungen bestehen.',
    landlordQuestion: 'Hast du offene Betreibungen?',
    landlordSees: 'Ob ein aktueller Betreibungsauszug vorliegt.',
    youUpload: 'Auszug vom Betreibungsamt, max. 3 Monate alt',
    scopeItems: ['Betreibungsauszug'],
    lineItems: ['Betreibungsauszug eingereicht und geprüft'],
    requiredDocuments: ['Auszug vom Betreibungsamt (max. 3 Monate alt)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ARBEIT_EINKOMMEN',
    order: 2,
    title: 'Lohn & Arbeitsstelle',
    summary: 'Lohnabrechnung und Arbeitgeberbestätigung zeigen, was du verdienst und wo du arbeitest.',
    landlordQuestion: 'Was verdienst du, und wo arbeitest du?',
    landlordSees: 'Lohn und Arbeitsstelle auf einer Zeile.',
    youUpload: 'Lohnabrechnung und ein kurzes Formular für den Arbeitgeber',
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
      'Lohnabrechnung oder Lohnausweis',
      'Arbeitgeberbestätigung — SIC-Formular, vom Arbeitgeber unterschrieben',
    ],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ZUVERLAESSIGKEIT',
    order: 3,
    title: 'Referenz vom Vermieter',
    summary: 'Dein bisheriger Vermieter bestätigt schriftlich, wie das Mietverhältnis lief.',
    landlordQuestion: 'Wie war es bei deinem letzten Vermieter?',
    landlordSees: 'Eine schriftliche Referenz — er muss nicht selbst anrufen.',
    youUpload: 'Ein kurzes Formular für deinen bisherigen Vermieter',
    scopeItems: ['Vermieterreferenz'],
    lineItems: ['Vermieterreferenz (Referenzschreiben eingereicht und geprüft)'],
    requiredDocuments: ['Vermieter-Referenz — SIC-Formular, vom Vermieter unterschrieben'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'AUFENTHALT',
    order: 4,
    title: 'Ausweis',
    summary: 'Pass, ID oder Bewilligung zeigen, wer du bist und dass der Aufenthalt geregelt ist.',
    landlordQuestion: 'Ist dein Ausweis gültig?',
    landlordSees: 'Dass ein gültiger Ausweis oder eine Bewilligung vorliegt.',
    youUpload: 'Pass, ID oder Aufenthaltsbewilligung',
    scopeItems: ['Pass / ID oder Aufenthaltsbewilligung'],
    lineItems: ['Aufenthaltsstatus (entsprechender Nachweis geprüft)'],
    requiredDocuments: ['Pass, ID oder Aufenthaltsbewilligung (C, B, L)'],
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
