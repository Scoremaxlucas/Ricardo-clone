/**
 * Swiss Immo Cert (SIC) — Produktdefinition.
 *
 * Verkauf: Erstkauf ist immer das Komplett-Paket (Basis + alle Angaben).
 * Nachkauf einzelner Angaben nur im Workspace, nicht als Baukasten.
 * Auf dem Dokument erscheinen nur bezahlte + freigegebene Angaben als «GEPRÜFT».
 *
 * Diese Datei ist die Single Source of Truth für Preise und Modulinhalte.
 */

export const SIC_CURRENCY = 'CHF' as const

/**
 * TESTPREISE: 10 Rappen pro Position, damit der Zahlungsweg echt durchlaufen wird.
 * Bei Total 0 wird Stripe übersprungen; unter `SIC_MIN_CHARGE_CHF` hebt das Quote
 * den Betrag sichtbar auf das Stripe-Minimum an.
 * Produktion wiederherstellen: Basis 20 / Modul 30 / Bundle 120.
 */
export const SIC_BASE_FEE_CHF: number = 0.1

/** Preis pro verifiziertem Modul. */
export const SIC_MODULE_FEE_CHF: number = 0.1

/** Komplett-Paket: Basis + alle 4 Module zum Bundle-Preis. */
export const SIC_BUNDLE_ALL_MODULES_CHF: number = 0.5

/**
 * Verlängerung: setzt die alternden Angaben zurück (frischer Betreibungsauszug),
 * die dauerhaften bleiben stehen. Produktion wiederherstellen: 30.
 */
export const SIC_RENEWAL_FEE_CHF: number = 0.1

/**
 * Stripe verrechnet keine Zahlung unter diesem Betrag (docs.stripe.com/currencies,
 * CHF: 0.50). Kleinere Summen scheitern mit `amount_too_small`.
 */
export const SIC_MIN_CHARGE_CHF = 0.5

/** Auf Rappen runden — verhindert Float-Reste wie 0.30000000000000004. */
export function roundSicChf(chf: number): number {
  return Math.round(chf * 100) / 100
}

/** Anzeige: «Kostenlos», «CHF 0.10», «CHF 30.–». */
export function formatSicChf(chf: number): string {
  if (chf <= 0) return 'Kostenlos'
  return Number.isInteger(chf) ? `CHF ${chf}.–` : `CHF ${chf.toFixed(2)}`
}

/** Gültigkeit eines Zertifikats bzw. einer Verlängerung in Kalendermonaten. */
export const SIC_VALIDITY_MONTHS = 3

export type SicModuleId = 'BONITAET' | 'ARBEIT_EINKOMMEN' | 'ZUVERLAESSIGKEIT' | 'AUFENTHALT'

export type SicModuleDefinition = {
  id: SicModuleId
  /**
   * Reihenfolge auf Zertifikat/Checkout/Dossier. Selbst beschaffbare Angaben
   * stehen zuerst, damit nach wenigen Tagen ein brauchbares Zertifikat existiert.
   */
  order: number
  /** Ohne Unterschrift Dritter beschaffbar — bestimmt die Reihenfolge. */
  selfObtainable: boolean
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
    selfObtainable: true,
    title: 'Betreibungsauszug',
    summary: 'Der Auszug vom Betreibungsamt zeigt, ob offene Betreibungen bestehen.',
    landlordQuestion: 'Hast du offene Betreibungen?',
    landlordSees: 'Dass keine offenen Betreibungen bestehen — mit Datum und Amt.',
    youUpload: 'Auszug vom Betreibungsamt, max. 3 Monate alt',
    scopeItems: ['Betreibungsauszug'],
    lineItems: ['Betreibungsauszug eingereicht und geprüft'],
    requiredDocuments: ['Auszug vom Betreibungsamt (max. 3 Monate alt)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'AUFENTHALT',
    order: 2,
    selfObtainable: true,
    title: 'Ausweis',
    summary: 'Pass, ID oder Bewilligung zeigen, wer du bist und dass der Aufenthalt geregelt ist.',
    landlordQuestion: 'Ist dein Ausweis gültig?',
    landlordSees: 'Ausweisart und Gültigkeit.',
    youUpload: 'Pass, ID oder Aufenthaltsbewilligung',
    scopeItems: ['Pass / ID oder Aufenthaltsbewilligung'],
    lineItems: ['Aufenthaltsstatus (entsprechender Nachweis geprüft)'],
    requiredDocuments: ['Pass, ID oder Aufenthaltsbewilligung (C, B, L)'],
    priceChf: SIC_MODULE_FEE_CHF,
  },
  {
    id: 'ARBEIT_EINKOMMEN',
    order: 3,
    selfObtainable: false,
    title: 'Lohn & Arbeitsstelle',
    summary: 'Lohnabrechnung und Arbeitgeberbestätigung zeigen, was du verdienst und wo du arbeitest.',
    landlordQuestion: 'Was verdienst du, und wo arbeitest du?',
    landlordSees: 'Einkommensband, Anstellungsart und die tragbare Monatsmiete.',
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
    order: 4,
    selfObtainable: false,
    title: 'Referenz vom Vermieter',
    summary: 'Dein bisheriger Vermieter bestätigt schriftlich, wie das Mietverhältnis lief.',
    landlordQuestion: 'Wie war es bei deinem letzten Vermieter?',
    landlordSees: 'Mietdauer und Zahlungsverhalten — er muss nicht selbst anrufen.',
    youUpload: 'Ein kurzes Formular für deinen bisherigen Vermieter',
    scopeItems: ['Vermieterreferenz'],
    lineItems: ['Vermieterreferenz (Referenzschreiben eingereicht und geprüft)'],
    requiredDocuments: ['Vermieter-Referenz — SIC-Formular, vom Vermieter unterschrieben'],
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

export function sicAllModuleIds(): SicModuleId[] {
  return SIC_MODULES.map(m => m.id)
}

/**
 * Erstkauf immer der ganze Katalog. Nachkauf: nur gewählte, noch nicht bezahlte
 * Angaben. Verlängerung kauft keine Angabe.
 */
export function resolveSicCheckoutModuleIds(opts: {
  includeBaseFee: boolean
  isRenewal?: boolean
  requested: unknown
  alreadyPaid?: readonly string[]
}): SicModuleId[] {
  if (opts.isRenewal) return []
  if (opts.includeBaseFee) return sicAllModuleIds()
  const paid = new Set(opts.alreadyPaid ?? [])
  return normalizeSicModuleIds(opts.requested).filter(id => !paid.has(id))
}

/** Katalogpreis einzeln: Basis + jedes Modul zum Einzelpreis. */
export function sicCatalogListTotalChf(): number {
  return roundSicChf(SIC_BASE_FEE_CHF + SIC_MODULES.reduce((sum, m) => sum + m.priceChf, 0))
}

/**
 * Ohne diese Angaben ist das Dokument kein Mieter-Zertifikat — nur der Stand
 * der Prüfung. Beide sind selbst beschaffbar, damit das Siegel nicht an einer
 * fremden Unterschrift hängt.
 */
export const SIC_SEAL_MODULE_IDS: readonly SicModuleId[] = ['BONITAET', 'AUFENTHALT']

export type SicDocumentPresentation = 'certificate' | 'working'

export function isSicCertificateSealReady(verifiedKinds: Iterable<string>): boolean {
  const set = new Set(verifiedKinds)
  return SIC_SEAL_MODULE_IDS.every(id => set.has(id))
}

export function sicSealRequirementLabel(): string {
  const titles = SIC_SEAL_MODULE_IDS.map(id => getSicModule(id).title)
  if (titles.length === 2) return `${titles[0]} und ${titles[1]}`
  return titles.join(', ')
}

export const SIC_WORKING_DOC_TITLE = 'STAND DER PRÜFUNG'
export const SIC_CERT_DOCUMENT_TITLE = 'MIETER-ZERTIFIKAT'
export const SIC_WORKING_DOC_TAGLINE = 'Noch kein Mieter-Zertifikat — nur geprüfte Angaben.'
export const SIC_WORKING_NOTICE = `Dies ist der Stand der Prüfung, kein Mieter-Zertifikat. Das Siegel gibt es, sobald ${sicSealRequirementLabel()} geprüft sind.`

/**
 * Ersparnis Komplett-Paket gegenüber einzeln.
 * 0 solange Bundle = Summe der Einzelpreise — UI darf dann keinen Rabatt vortäuschen.
 */
export function sicBundleSavingsChf(): number {
  return Math.max(0, roundSicChf(sicCatalogListTotalChf() - SIC_BUNDLE_ALL_MODULES_CHF))
}

/**
 * Umfangssatz auf Dokument und Prüfseite. Verhindert, dass ein Vermieter eine
 * fehlende Angabe als «geprüft und negativ» missversteht.
 */
export const SIC_SCOPE_NOTE =
  'Dieses Zertifikat weist die aufgeführten Angaben aus. Nicht aufgeführte Angaben wurden nicht geprüft.'

export const SIC_WORKING_SCOPE_NOTE =
  'Dieses Dokument weist die aufgeführten Angaben aus. Es ist kein Mieter-Zertifikat. Nicht aufgeführte Angaben wurden nicht geprüft.'

/** Footer auf PDF und Prüfseite — derselbe Satz wie AGB §1, kein Gütesiegel. */
export const SIC_PLAUSIBILITY_FOOTER =
  'Die Prüfung ist eine Kontrolle auf Vollständigkeit und Plausibilität. Das Zertifikat ist keine Bonitätsbewertung, keine behördliche Auskunft und keine Empfehlung.'

export const SIC_WORKING_PLAUSIBILITY_FOOTER =
  'Die Prüfung ist eine Kontrolle auf Vollständigkeit und Plausibilität. Dieses Dokument ist keine Bonitätsbewertung, keine behördliche Auskunft und keine Empfehlung.'

/** Badge auf Urkunde und Prüfseite — «geprüft», nicht «verifiziert» im Sinne einer Auskunftei. */
export const SIC_MODULE_BADGE = 'GEPRÜFT'

/** «2 von 4 Angaben geprüft» — Bezugsgrösse ist immer der ganze Katalog. */
export function sicCompletenessLabel(verifiedCount: number): string {
  return `${verifiedCount} von ${SIC_MODULES.length} Angaben geprüft`
}

/** Kostet aktuell überhaupt etwas? Steuert «Kostenlos»-Copy in der Oberfläche. */
export function sicIsFree(): boolean {
  return sicCatalogListTotalChf() === 0
}
