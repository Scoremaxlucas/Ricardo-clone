import { prisma } from '@/lib/prisma'
import { canChangeSicEmail, sicPendingEmailChangeStatus } from '@/lib/sic/email-change'
import {
  readSicFacts,
  sicDebtDisclosureConsent,
  sicIdCapsExpiry,
  sicIdReplacementDue,
  sicIdValidUntil,
  type SicFacts,
} from '@/lib/sic/facts'
import { isSicCouple } from '@/lib/sic/household'
import {
  getSicModule,
  isSicCertificateSealReady,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicRequiredDocuments,
  type SicModuleId,
} from '@/lib/sic/modules'
import { loadSicRenewalPending, modulesResetByRenewal } from '@/lib/sic/renewal'
import { sicRevokedCanStartOver } from '@/lib/sic/start-over'
import { templatesForModule } from '@/lib/sic/templates'
import { normalizeEmail } from '@/lib/sic/session'
import { isSicExpired, parseSicCalendarDate } from '@/lib/sic/validity'
import type { SicModuleStatus } from '@prisma/client'

export * from '@/lib/sic/dossier-core'
import {
  isSicLandlordPdfReady,
  joinHouseholdHolderName,
  readIncomeGroup,
  sicFactLineOptsFromHolders,
  sicPresentedModules,
  verifiedModuleLineItems,
  type SicChecklistItem,
  type SicDossierModuleView,
  type SicDossierView,
  type SicUploadedDocMeta,
} from '@/lib/sic/dossier-core'

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

function idRenewalFor(
  moduleKind: SicModuleId,
  row: { status: SicModuleStatus; verifiedFacts: unknown },
  cert: { status: string; expiresAt: Date | null },
  extractFacts: SicFacts | null,
  names: { person1: string | null; person2: string | null; couple: boolean }
): { validUntil: string; person: string | null } | null {
  if (moduleKind !== 'AUFENTHALT' || row.status !== 'VERIFIED' || cert.status === 'REVOKED') return null
  const facts = readSicFacts('AUFENTHALT', row.verifiedFacts)
  const active = cert.status === 'ACTIVE' && !isSicExpired(cert.expiresAt)
  // Auch nach Ablauf: endete es wegen des Ausweises, reicht ein neuer Ausweis.
  const open = active ? sicIdReplacementDue(facts, cert.expiresAt) : sicIdCapsExpiry(facts, extractFacts)
  if (!open) return null
  const until = sicIdValidUntil(facts)
  if (!until) return null
  // Paar: wessen Ausweis? Der mit dem früheren Ablaufdatum.
  let person: string | null = null
  if (names.couple && facts) {
    const d1 = parseSicCalendarDate(facts.validUntil)?.getTime() ?? Infinity
    const d2 = parseSicCalendarDate(facts.validUntil2)?.getTime() ?? Infinity
    person = d1 === d2 ? null : d1 < d2 ? names.person1 : names.person2
  }
  return { validUntil: until.toISOString(), person }
}

function verifiedFactsOf(modules: { moduleKind: string; status: SicModuleStatus; verifiedFacts: unknown }[], kind: SicModuleId) {
  const row = modules.find(m => m.moduleKind === kind && m.status === 'VERIFIED')
  return row ? readSicFacts(kind, row.verifiedFacts) : null
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

  const presentedModules = sicPresentedModules(cert.modules, cert)
  const certificateLinesByKind = new Map(
    verifiedModuleLineItems(presentedModules, lineOpts).map(m => [m.id as string, m.lines])
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
      incomeGroup:
        def.id === 'ARBEIT_EINKOMMEN' && row.status === 'NOT_APPLICABLE' ? readIncomeGroup(row.verifiedFacts) : null,
      debtDisclosure:
        def.id === 'BONITAET' ?
          {
            consent: sicDebtDisclosureConsent(row.verifiedFacts),
            printed: (certificateLinesByKind.get(def.id) ?? []).some(l => /offene Betreibung/.test(l)),
          }
        : null,
      idRenewal: idRenewalFor(def.id, row, cert, verifiedFactsOf(cert.modules, 'BONITAET'), {
        couple,
        person1: lineOpts.person1Label ?? null,
        person2: lineOpts.person2Label ?? null,
      }),
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
  const [renewalPending, canStartOver] = await Promise.all([
    cert.certifiedAt ? loadSicRenewalPending(prisma, cert.id) : Promise.resolve(false),
    cert.status === 'REVOKED' ? sicRevokedCanStartOver(cert.id) : Promise.resolve(false),
  ])
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
      modules: presentedModules,
    }),
    certificateSealReady: isSicCertificateSealReady(
      presentedModules.filter(m => m.status === 'VERIFIED').map(m => m.moduleKind)
    ),
    progress: {
      totalModules: purchasedModules.length,
      catalogModules: SIC_MODULES.length,
      verifiedCount,
      pendingDocsCount,
      inReviewCount,
      rejectedCount,
    },
    canStartOver,
    renewal: {
      available: !!cert.certifiedAt && cert.status !== 'REVOKED' && !renewalPending,
      // Endet es nur wegen des Ausweises, ist der neue Ausweis der Weg — nicht die bezahlte Verlängerung.
      recommended:
        !!cert.certifiedAt &&
        !renewalPending &&
        (expired || expiresSoon) &&
        !sicIdCapsExpiry(verifiedFactsOf(cert.modules, 'AUFENTHALT'), verifiedFactsOf(cert.modules, 'BONITAET')),
      pending: renewalPending,
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
