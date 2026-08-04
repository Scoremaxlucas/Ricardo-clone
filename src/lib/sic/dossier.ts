import { prisma } from '@/lib/prisma'
import { getSicModule, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'
import { templatesForModule } from '@/lib/sic/templates'
import { normalizeEmail } from '@/lib/sic/session'
import type { SicModuleStatus } from '@prisma/client'

export type SicChecklistItem = {
  id: string
  label: string
  kind: 'upload' | 'template'
  /** Template-ID wenn kind === 'template' */
  templateId?: string
}

export type SicUploadedDocMeta = {
  fileName: string
  uploadedAt: string
}

export type SicDossierModuleView = {
  moduleKind: SicModuleId
  title: string
  summary: string
  requiredDocuments: string[]
  checklist: SicChecklistItem[]
  status: SicModuleStatus
  documentCount: number
  documents: SicUploadedDocMeta[]
  reviewNote: string | null
}

export type SicDossierView = {
  email: string
  certificateCode: string
  status: string
  issuedAt: string
  expiresAt: string
  holderName: string | null
  hasVerifiedModule: boolean
  progress: {
    totalModules: number
    verifiedCount: number
    pendingDocsCount: number
    inReviewCount: number
    rejectedCount: number
  }
  purchasedModules: SicDossierModuleView[]
  availableModules: { moduleKind: SicModuleId; title: string; summary: string; priceChf: number }[]
}

/** Baut die Liste verifizierter Module (mit Zertifikatszeilen) für PDF und Verifikation. */
export function verifiedModuleLineItems(
  modules: { moduleKind: string; status: SicModuleStatus }[]
): { title: string; lines: string[] }[] {
  const verified = new Set(modules.filter(m => m.status === 'VERIFIED').map(m => m.moduleKind))
  return SIC_MODULES.filter(def => verified.has(def.id)).map(def => ({ title: def.title, lines: def.lineItems }))
}

export function joinHolderName(first: string | null, last: string | null): string | null {
  const name = `${(first ?? '').trim()} ${(last ?? '').trim()}`.trim()
  return name || null
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
      label: `${t.title} (SIC-PDF-Formular zum Ausfüllen lassen)`,
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
        select: { moduleKind: true, fileName: true, uploadedAt: true },
        orderBy: { uploadedAt: 'asc' },
      },
    },
  })
  if (!cert) return null

  const docsByKind = new Map<string, SicUploadedDocMeta[]>()
  for (const d of cert.documents) {
    const list = docsByKind.get(d.moduleKind) ?? []
    list.push({ fileName: d.fileName, uploadedAt: d.uploadedAt.toISOString() })
    docsByKind.set(d.moduleKind, list)
  }

  const purchasedKinds = new Set(cert.modules.map(m => m.moduleKind))

  const purchasedModules: SicDossierModuleView[] = SIC_MODULES.filter(def => purchasedKinds.has(def.id)).map(def => {
    const row = cert.modules.find(m => m.moduleKind === def.id)!
    const documents = docsByKind.get(def.id) ?? []
    return {
      moduleKind: def.id,
      title: def.title,
      summary: def.summary,
      requiredDocuments: def.requiredDocuments,
      checklist: buildChecklist(def.id, def.requiredDocuments),
      status: row.status,
      documentCount: documents.length,
      documents,
      reviewNote: row.reviewNote,
    }
  })

  const availableModules = SIC_MODULES.filter(def => !purchasedKinds.has(def.id)).map(def => ({
    moduleKind: def.id,
    title: def.title,
    summary: def.summary,
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

  return {
    email,
    certificateCode: cert.certificateCode,
    status: cert.status,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt.toISOString(),
    holderName: joinHolderName(cert.holderFirstName, cert.holderLastName),
    hasVerifiedModule: verifiedCount > 0,
    progress: {
      totalModules: purchasedModules.length,
      verifiedCount,
      pendingDocsCount,
      inReviewCount,
      rejectedCount,
    },
    purchasedModules,
    availableModules,
  }
}

export function sicModuleTitle(id: SicModuleId): string {
  return getSicModule(id).title
}
