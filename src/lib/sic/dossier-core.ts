/**
 * Reine Ansichtslogik für Dossier, PDF und Prüfseite — ohne Datenbank, damit
 * Client-Komponenten sie importieren können. Server-Teil: `dossier.ts`.
 */
import {
  readSicFacts,
  sicFactGroups,
  sicFactsLapsed,
  sicHasCheckedFacts,
  sicIncomeGroupLabel,
  type SicFactGroup,
  type SicFactLineOpts,
  type SicFacts,
  type SicIncomeGroup,
} from '@/lib/sic/facts'
import { type SicHouseholdKind } from '@/lib/sic/household'
import {
  isSicModuleId,
  SIC_DECLARED_BADGE,
  SIC_INCOME_NOT_CHECKED_LINE,
  SIC_MODULES,
  SIC_NO_PRIOR_REFERENCE_LINE,
  type SicModuleId,
} from '@/lib/sic/modules'
import type { SicModuleStatus } from '@prisma/client'

export type SicChecklistItem = {
  id: string
  label: string
  kind: 'upload' | 'template'
  /** Template-ID wenn kind === 'template' */
  templateId?: string
}

export type SicUploadedDocMeta = {
  id: string
  fileName: string
  uploadedAt: string
  sizeBytes: number
}

export type SicDossierModuleView = {
  moduleKind: SicModuleId
  title: string
  summary: string
  landlordSees: string
  requiredDocuments: string[]
  checklist: SicChecklistItem[]
  status: SicModuleStatus
  documentCount: number
  documents: SicUploadedDocMeta[]
  reviewNote: string | null
  /** Die geprüften Zeilen, wie sie auf dem Zertifikat stehen (nur bei VERIFIED). */
  certificateLines: string[]
  /** Lohn & Arbeitsstelle als «nicht angestellt» vermerkt. */
  incomeGroup?: SicIncomeGroup | null
  /** Ausweis: geprüfter läuft bald ab oder kürzt das Zertifikat — neuer kann eingereicht werden. */
  idRenewal?: { validUntil: string; person: string | null } | null
  /** Betreibungsauszug: Zustimmung zur offenen Ausweisung kleiner Betreibungen; ob eine draufsteht. */
  debtDisclosure?: { consent: boolean; printed: boolean } | null
}

export type SicDossierView = {
  email: string
  /** Einmalige Korrektur nach dem Kauf, solange noch nicht bestätigt. */
  canChangeEmail: boolean
  /** Neue Adresse, solange die Bestätigung nicht abgelaufen ist. */
  pendingEmail: string | null
  certificateCode: string
  status: string
  /** Kaufdatum. */
  issuedAt: string
  /** Ausstellungsdatum = erste Freigabe. Null solange nichts geprüft ist. */
  certifiedAt: string | null
  /** Null solange kein Zertifikat existiert — dann läuft auch keine Frist. */
  expiresAt: string | null
  expired: boolean
  validityMonths: number
  holderName: string | null
  holderFirstName: string | null
  holderLastName: string | null
  holder2FirstName: string | null
  holder2LastName: string | null
  householdKind: SicHouseholdKind
  couple: boolean
  hasVerifiedModule: boolean
  /** Vermieter-PDF/QR sobald mindestens ein Modul geprüft ist und der Name steht. */
  landlordPdfReady: boolean
  /** Urkunden-Optik: Betreibungsauszug und Ausweis geprüft. */
  certificateSealReady: boolean
  progress: {
    totalModules: number
    /** Alle vier Angaben des Katalogs — Bezugsgrösse für «X von 4 geprüft». */
    catalogModules: number
    verifiedCount: number
    pendingDocsCount: number
    inReviewCount: number
    rejectedCount: number
  }
  /** Widerrufen nach voller Erstattung: unter derselben E-Mail neu anlegen. */
  canStartOver: boolean
  renewal: {
    available: boolean
    recommended: boolean
    /** Verlängerung bezahlt, neuer Betreibungsauszug noch nicht freigegeben. */
    pending: boolean
    priceChf: number
    /** Angaben, die eine Verlängerung neu einfordert. */
    refreshes: { moduleKind: SicModuleId; title: string }[]
  }
  purchasedModules: SicDossierModuleView[]
  availableModules: {
    moduleKind: SicModuleId
    title: string
    summary: string
    landlordSees: string
    priceChf: number
  }[]
}

export type SicVerifiedModuleView = {
  id: SicModuleId
  title: string
  /** Flach, beim Paar mit «Name: » davor. */
  lines: string[]
  /** Nach Person gruppiert — für Dokument und Prüfseite. */
  groups?: SicFactGroup[]
  badge?: string
}

/** Zählt nur tatsächlich geprüfte Angaben; die selbst deklarierte Referenz (badge) zählt nicht als «geprüft». */
export function sicVerifiedRowCount(rows: SicVerifiedModuleView[]): number {
  return rows.filter(r => !r.badge).length
}

/**
 * Was Vermieter sehen: freigegebene Angaben, plus bei einer frühzeitigen
 * Verlängerung die zuletzt geprüften Werte, solange das Zertifikat noch gilt
 * und der neue Nachweis offen ist. Nach Ablauf zählt nur noch VERIFIED.
 */
export function sicPresentedModules<
  M extends { moduleKind: string; status: SicModuleStatus; verifiedFacts?: unknown },
>(modules: M[], cert: { status: string; expiresAt: Date | null }, now = new Date()): M[] {
  const valid =
    cert.status === 'ACTIVE' && !!cert.expiresAt && cert.expiresAt.getTime() > now.getTime()
  if (!valid) return modules
  return modules.map(m => {
    if (m.status === 'VERIFIED' || m.status === 'NOT_APPLICABLE' || m.verifiedFacts == null)
      return m
    // Nur echte, noch gültige Prüfwerte mittragen — keine Selbstangaben, kein abgelaufener Ausweis.
    if (!isSicModuleId(m.moduleKind)) return m
    const facts = readSicFacts(m.moduleKind, m.verifiedFacts)
    if (!sicHasCheckedFacts(m.moduleKind, facts) || sicFactsLapsed(m.moduleKind, facts, now)) return m
    return { ...m, status: 'VERIFIED' as const }
  })
}

/**
 * Baut die Liste verifizierter Module für PDF und Prüfseite.
 * Bevorzugt die bei der Freigabe erfassten Werte; bereits freigegebene Module
 * ohne Werte fallen auf die generischen Zeilen aus `modules.ts` zurück.
 */
export function verifiedModuleLineItems(
  modules: { moduleKind: string; status: SicModuleStatus; verifiedFacts?: unknown }[],
  lineOpts?: SicFactLineOpts,
  now = new Date()
): SicVerifiedModuleView[] {
  // Beendeter befristeter Vertrag, abgelaufener Ausweis: geprüft, aber nicht mehr wahr.
  const verified = new Map(
    modules
      .filter(m => m.status === 'VERIFIED')
      .filter(
        m =>
          !isSicModuleId(m.moduleKind) ||
          !sicFactsLapsed(m.moduleKind, readSicFacts(m.moduleKind, m.verifiedFacts), now)
      )
      .map(m => [m.moduleKind, m.verifiedFacts])
  )
  const rows: SicVerifiedModuleView[] = SIC_MODULES.filter(def => verified.has(def.id)).map(def => {
    const facts = readSicFacts(def.id, verified.get(def.id))
    const groups = sicFactGroups(def.id, facts, lineOpts)
    if (groups.length === 0) return { id: def.id, title: def.title, lines: def.lineItems }
    return {
      id: def.id,
      title: def.title,
      lines: groups.flatMap(g => g.lines.map(line => (g.label ? `${g.label}: ${line}` : line))),
      groups,
    }
  })

  // Selbstangaben ohne Nachweis: stehen da, zählen aber nicht als «geprüft».
  for (const def of SIC_MODULES) {
    if (verified.has(def.id)) continue
    const row = modules.find(m => m.moduleKind === def.id && m.status === 'NOT_APPLICABLE')
    if (!row) continue
    const lines =
      def.id === 'ZUVERLAESSIGKEIT'
        ? [SIC_NO_PRIOR_REFERENCE_LINE]
        : def.id === 'ARBEIT_EINKOMMEN'
          ? sicIncomeGroupLines(row.verifiedFacts)
          : null
    if (lines) rows.push({ id: def.id, title: def.title, lines, badge: SIC_DECLARED_BADGE })
  }
  // Selbstangaben am Schluss: erst was geprüft ist, dann was nur vermerkt ist.
  return rows
}

export function readIncomeGroup(stored: unknown): SicIncomeGroup | null {
  const value =
    stored && typeof stored === 'object' ? (stored as Record<string, unknown>).incomeGroup : null
  return sicIncomeGroupLabel(value) ? (value as SicIncomeGroup) : null
}

function sicIncomeGroupLines(stored: unknown): string[] | null {
  const label = sicIncomeGroupLabel(readIncomeGroup(stored))
  return label ? [label, SIC_INCOME_NOT_CHECKED_LINE] : null
}

/**
 * Was der Vermieter sähe, wenn diese Angabe jetzt freigegeben würde.
 * Andere noch offene Angaben bleiben draussen — wie auf PDF und QR-Seite.
 */
export function previewSicVerifiedModules(
  modules: { moduleKind: string; status: string; verifiedFacts?: unknown }[],
  draft: { moduleKind: SicModuleId; facts: SicFacts },
  lineOpts?: SicFactLineOpts
): SicVerifiedModuleView[] {
  const merged = modules.map(m =>
    m.moduleKind === draft.moduleKind
      ? { ...m, status: 'VERIFIED' as const, verifiedFacts: draft.facts }
      : m
  )
  if (!merged.some(m => m.moduleKind === draft.moduleKind)) {
    merged.push({
      moduleKind: draft.moduleKind,
      status: 'VERIFIED',
      verifiedFacts: draft.facts,
    })
  }
  return verifiedModuleLineItems(
    merged as { moduleKind: string; status: SicModuleStatus; verifiedFacts?: unknown }[],
    lineOpts
  )
}

export function joinHolderName(first: string | null, last: string | null): string | null {
  const f = (first ?? '').trim()
  const l = (last ?? '').trim()
  if (!f || !l) return null
  return `${f} ${l}`
}

export function joinHouseholdHolderName(opts: {
  firstName: string | null
  lastName: string | null
  firstName2?: string | null
  lastName2?: string | null
  couple?: boolean
}): string | null {
  const first = joinHolderName(opts.firstName, opts.lastName)
  if (!opts.couple) return first
  const second = joinHolderName(opts.firstName2 ?? null, opts.lastName2 ?? null)
  if (!first || !second) return null
  return `${first} und ${second}`
}

export type SicTemplatePrefillNames = {
  /** Person 1 oder, bei der Vermieter-Referenz, der Haushaltsname. */
  primary: string | null
  /** Person 2 — nur Arbeitgeber/Ausweis-nahe Formulare beim Paar. */
  secondary: string | null
}

/**
 * Namen für den Template-Prefill je Modul.
 * Arbeitgeberbestätigung: eine Person pro PDF. Vermieter-Referenz: «A und B».
 */
export function templatePrefillNamesForModule(
  moduleKind: SicModuleId,
  dossier: Pick<
    SicDossierView,
    | 'holderName'
    | 'holderFirstName'
    | 'holderLastName'
    | 'holder2FirstName'
    | 'holder2LastName'
    | 'couple'
  >
): SicTemplatePrefillNames {
  if (moduleKind === 'ZUVERLAESSIGKEIT') {
    return { primary: dossier.holderName, secondary: null }
  }
  return {
    primary: joinHolderName(dossier.holderFirstName, dossier.holderLastName),
    secondary: dossier.couple
      ? joinHolderName(dossier.holder2FirstName, dossier.holder2LastName)
      : null,
  }
}

export function sicFactLineOptsFromHolders(opts: {
  couple: boolean
  firstName: string | null
  lastName: string | null
  firstName2?: string | null
  lastName2?: string | null
}): SicFactLineOpts {
  return {
    couple: opts.couple,
    person1Label: joinHolderName(opts.firstName, opts.lastName),
    person2Label: opts.couple
      ? joinHolderName(opts.firstName2 ?? null, opts.lastName2 ?? null)
      : null,
  }
}

const HOLDER_NAME_SEP = '\t'

/** Speichert Vor- und Nachname verlustfrei auf der Zahlung (nicht am Leerzeichen trennen). */
export function encodePaymentHolderName(
  first: string,
  last: string,
  first2?: string | null,
  last2?: string | null
): string {
  const base = `${first.trim()}${HOLDER_NAME_SEP}${last.trim()}`
  const a = (first2 ?? '').trim()
  const b = (last2 ?? '').trim()
  if (a && b) return `${base}${HOLDER_NAME_SEP}${a}${HOLDER_NAME_SEP}${b}`
  return base
}

export type SicPaymentHolderName = {
  firstName: string
  lastName: string
  firstName2: string | null
  lastName2: string | null
}

/**
 * Liest den Checkout-Namen. Neue Zahlungen: Tab-getrennt (zwei oder vier Teile).
 * Alte Einträge: erstes Wort = Vorname, Rest = Nachname.
 */
export function decodePaymentHolderName(raw?: string | null): SicPaymentHolderName | null {
  const cleaned = (raw ?? '').trim()
  if (!cleaned) return null
  if (cleaned.includes(HOLDER_NAME_SEP)) {
    const parts = cleaned.split(HOLDER_NAME_SEP).map(p => p.trim())
    const firstName = parts[0] ?? ''
    const lastName = parts[1] ?? ''
    if (!firstName || !lastName) return null
    const firstName2 = parts[2] || null
    const lastName2 = parts[3] || null
    return {
      firstName,
      lastName,
      firstName2: firstName2 && lastName2 ? firstName2 : null,
      lastName2: firstName2 && lastName2 ? lastName2 : null,
    }
  }
  const parts = cleaned.replace(/\s+/g, ' ').split(' ')
  if (parts.length === 1)
    return { firstName: parts[0], lastName: '', firstName2: null, lastName2: null }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
    firstName2: null,
    lastName2: null,
  }
}

/**
 * Abrufbares PDF: mindestens eine geprüfte Angabe, Name gesetzt,
 * nicht widerrufen und nicht abgelaufen. Unter dem Siegel-Minimum ist das
 * ein Stand der Prüfung, kein Mieter-Zertifikat.
 */
export function isSicLandlordPdfReady(opts: {
  holderName: string | null
  status: string
  expiresAt: Date | string | null
  modules: { status: string }[]
}): boolean {
  if (opts.status === 'REVOKED' || opts.status === 'EXPIRED') return false
  if (!opts.holderName) return false
  if (!opts.modules.some(m => m.status === 'VERIFIED')) return false
  if (opts.expiresAt === null) return false
  const expiresAt =
    typeof opts.expiresAt === 'string'
      ? new Date(opts.expiresAt).getTime()
      : opts.expiresAt.getTime()
  return expiresAt > Date.now()
}
