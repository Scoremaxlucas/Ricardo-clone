import { prisma } from '@/lib/prisma'
import { canChangeSicEmail, sicPendingEmailChangeStatus } from '@/lib/sic/email-change'
import { readSicFacts, sicFactLines, type SicFactLineOpts, type SicFacts } from '@/lib/sic/facts'
import { isSicCouple, type SicHouseholdKind } from '@/lib/sic/household'
import {
  getSicModule,
  isSicCertificateSealReady,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicRequiredDocuments,
  type SicModuleId,
} from '@/lib/sic/modules'
import { modulesResetByRenewal } from '@/lib/sic/renewal'
import { templatesForModule } from '@/lib/sic/templates'
import { normalizeEmail } from '@/lib/sic/session'
import { isSicExpired } from '@/lib/sic/validity'
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
  renewal: {
    available: boolean
    recommended: boolean
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

export type SicVerifiedModuleView = { id: SicModuleId; title: string; lines: string[] }

/**
 * Baut die Liste verifizierter Module für PDF und Prüfseite.
 * Bevorzugt die bei der Freigabe erfassten Werte; bereits freigegebene Module
 * ohne Werte fallen auf die generischen Zeilen aus `modules.ts` zurück.
 */
export function verifiedModuleLineItems(
  modules: { moduleKind: string; status: SicModuleStatus; verifiedFacts?: unknown }[],
  lineOpts?: SicFactLineOpts
): SicVerifiedModuleView[] {
  const verified = new Map(
    modules.filter(m => m.status === 'VERIFIED').map(m => [m.moduleKind, m.verifiedFacts])
  )
  return SIC_MODULES.filter(def => verified.has(def.id)).map(def => {
    const facts = readSicFacts(def.id, verified.get(def.id))
    const lines = sicFactLines(def.id, facts, lineOpts)
    return {
      id: def.id,
      title: def.title,
      lines: lines.length > 0 ? lines : def.lineItems,
    }
  })
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
    m.moduleKind === draft.moduleKind ?
      { ...m, status: 'VERIFIED' as const, verifiedFacts: draft.facts }
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
    person2Label: opts.couple ? joinHolderName(opts.firstName2 ?? null, opts.lastName2 ?? null) : null,
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
  if (parts.length === 1) return { firstName: parts[0], lastName: '', firstName2: null, lastName2: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(' '), firstName2: null, lastName2: null }
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
    typeof opts.expiresAt === 'string' ? new Date(opts.expiresAt).getTime() : opts.expiresAt.getTime()
  return expiresAt > Date.now()
}

function buildChecklist(moduleKind: SicModuleId, requiredDocuments: string[]): SicChecklistItem[] {
  const templates = templatesForModule(moduleKind)
  const templateLabels = new Set(
    templates.flatMap(t => [
      t.title.toLowerCase(),
      ...t.title.toLowerCase().split(/\s+/),
    ])
  )

  const items: SicChecklistItem[] = []

  for (const t of templates) {
    items.push({
      id: `template:${t.id}`,
      label: `${t.title} (SIC-PDF zum Ausfüllen und Unterzeichnen)`,
      kind: 'template',
      templateId: t.id,
    })
  }

  for (const doc of requiredDocuments) {
    const lower = doc.toLowerCase()
    // Docs die klar das SIC-Formular meinen, nicht nochmal als Upload-Zeile listen.
    if (templates.some(t => lower.includes(t.title.toLowerCase()) || lower.includes('sic-formular'))) {
      continue
    }
    // Heuristik: Vermieter-Referenz / Arbeitgeberbestätigung bereits als Template
    if (Array.from(templateLabels).some(l => l.length > 4 && lower.includes(l))) {
      continue
    }
    items.push({
      id: `upload:${doc}`,
      label: doc,
      kind: 'upload',
    })
  }

  return items
}

export async function getSicDossierView(emailRaw: string): Promise<SicDossierView | null> {
  const email = normalizeEmail(emailRaw)
  const cert = await prisma.sicCertificate.findUnique({
    where: { email },
    include: {
      modules: true,
      documents: {
        select: { id: true, moduleKind: true, fileName: true, uploadedAt: true, sizeBytes: true },
        orderBy: { uploadedAt: 'asc' },
      },
    },
  })
  if (!cert) return null

  const docsByKind = new Map<string, SicUploadedDocMeta[]>()
  for (const d of cert.documents) {
    const list = docsByKind.get(d.moduleKind) ?? []
    list.push({
      id: d.id,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt.toISOString(),
      sizeBytes: d.sizeBytes,
    })
    docsByKind.set(d.moduleKind, list)
  }

  const purchasedKinds = new Set(cert.modules.map(m => m.moduleKind))

  const couple = isSicCouple(cert.householdKind)
  const holderFirstName = cert.holderFirstName?.trim() || null
  const holderLastName = cert.holderLastName?.trim() || null
  const holder2FirstName = cert.holder2FirstName?.trim() || null
  const holder2LastName = cert.holder2LastName?.trim() || null
  const lineOpts = sicFactLineOptsFromHolders({
    couple,
    firstName: holderFirstName,
    lastName: holderLastName,
    firstName2: holder2FirstName,
    lastName2: holder2LastName,
  })
  const holderName = joinHouseholdHolderName({
    firstName: holderFirstName,
    lastName: holderLastName,
    firstName2: holder2FirstName,
    lastName2: holder2LastName,
    couple,
  })

  const certificateLinesByKind = new Map(
    verifiedModuleLineItems(cert.modules, lineOpts).map(m => [m.id as string, m.lines])
  )

  const purchasedModules: SicDossierModuleView[] = SIC_MODULES.filter(def => purchasedKinds.has(def.id)).map(def => {
    const row = cert.modules.find(m => m.moduleKind === def.id)!
    const documents = docsByKind.get(def.id) ?? []
    const requiredDocuments = sicRequiredDocuments(def.id, couple)
    return {
      moduleKind: def.id,
      title: def.title,
      summary: def.summary,
      landlordSees: def.landlordSees,
      requiredDocuments,
      checklist: buildChecklist(def.id, requiredDocuments),
      status: row.status,
      documentCount: documents.length,
      documents,
      reviewNote: row.reviewNote,
      certificateLines: certificateLinesByKind.get(def.id) ?? [],
    }
  })

  const availableModules = SIC_MODULES.filter(def => !purchasedKinds.has(def.id)).map(def => ({
    moduleKind: def.id,
    title: def.title,
    summary: def.summary,
    landlordSees: def.landlordSees,
    priceChf: def.priceChf,
  }))

  let verifiedCount = 0
  let pendingDocsCount = 0
  let inReviewCount = 0
  let rejectedCount = 0
  for (const m of purchasedModules) {
    if (m.status === 'VERIFIED') verifiedCount++
    else if (m.status === 'PENDING_DOCS') pendingDocsCount++
    else if (m.status === 'IN_REVIEW') inReviewCount++
    else if (m.status === 'REJECTED') rejectedCount++
  }

  const expired = isSicExpired(cert.expiresAt)
  const renewalRefreshes = modulesResetByRenewal(
    cert.modules.map(m => ({
      moduleKind: m.moduleKind as SicModuleId,
      status: m.status,
      reviewedAt: m.reviewedAt,
      verifiedFacts: m.verifiedFacts,
    }))
  )
  const expiresSoon =
    !!cert.expiresAt && cert.expiresAt.getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000

  return {
    email,
    canChangeEmail: canChangeSicEmail(cert.emailChangedAt),
    pendingEmail:
      sicPendingEmailChangeStatus({
        pendingEmail: cert.pendingEmail,
        pendingEmailToken: cert.pendingEmailToken,
        pendingEmailExpiresAt: cert.pendingEmailExpiresAt,
      }) === 'valid' ?
        cert.pendingEmail
      : null,
    certificateCode: cert.certificateCode,
    status: cert.status,
    issuedAt: cert.issuedAt.toISOString(),
    certifiedAt: cert.certifiedAt ? cert.certifiedAt.toISOString() : null,
    expiresAt: cert.expiresAt ? cert.expiresAt.toISOString() : null,
    expired,
    validityMonths: SIC_VALIDITY_MONTHS,
    holderName,
    holderFirstName,
    holderLastName,
    holder2FirstName,
    holder2LastName,
    householdKind: couple ? 'COUPLE' : 'SINGLE',
    couple,
    hasVerifiedModule: verifiedCount > 0,
    landlordPdfReady: isSicLandlordPdfReady({
      holderName,
      status: cert.status,
      expiresAt: cert.expiresAt,
      modules: purchasedModules,
    }),
    certificateSealReady: isSicCertificateSealReady(
      purchasedModules.filter(m => m.status === 'VERIFIED').map(m => m.moduleKind)
    ),
    progress: {
      totalModules: purchasedModules.length,
      catalogModules: SIC_MODULES.length,
      verifiedCount,
      pendingDocsCount,
      inReviewCount,
      rejectedCount,
    },
    renewal: {
      available: !!cert.certifiedAt && cert.status !== 'REVOKED',
      recommended: !!cert.certifiedAt && (expired || expiresSoon),
      priceChf: SIC_RENEWAL_FEE_CHF,
      refreshes: renewalRefreshes.map(id => ({ moduleKind: id, title: getSicModule(id).title })),
    },
    purchasedModules,
    availableModules,
  }
}

export function sicModuleTitle(id: SicModuleId): string {
  return getSicModule(id).title
}
