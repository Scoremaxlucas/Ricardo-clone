import { prisma } from '@/lib/prisma'
import { getSicModule, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'
import { normalizeEmail } from '@/lib/sic/session'
import type { SicModuleStatus } from '@prisma/client'

export type SicDossierModuleView = {
  moduleKind: SicModuleId
  title: string
  summary: string
  requiredDocuments: string[]
  status: SicModuleStatus
  documentCount: number
  reviewNote: string | null
}

export type SicDossierView = {
  email: string
  certificateCode: string
  status: string
  issuedAt: string
  expiresAt: string
  purchasedModules: SicDossierModuleView[]
  availableModules: { moduleKind: SicModuleId; title: string; summary: string; priceChf: number }[]
}

export async function getSicDossierView(emailRaw: string): Promise<SicDossierView | null> {
  const email = normalizeEmail(emailRaw)
  const cert = await prisma.sicCertificate.findUnique({
    where: { email },
    include: {
      modules: true,
      documents: { select: { moduleKind: true } },
    },
  })
  if (!cert) return null

  const docCountByKind = new Map<string, number>()
  for (const d of cert.documents) {
    docCountByKind.set(d.moduleKind, (docCountByKind.get(d.moduleKind) ?? 0) + 1)
  }

  const purchasedKinds = new Set(cert.modules.map(m => m.moduleKind))

  const purchasedModules: SicDossierModuleView[] = SIC_MODULES.filter(def => purchasedKinds.has(def.id)).map(def => {
    const row = cert.modules.find(m => m.moduleKind === def.id)!
    return {
      moduleKind: def.id,
      title: def.title,
      summary: def.summary,
      requiredDocuments: def.requiredDocuments,
      status: row.status,
      documentCount: docCountByKind.get(def.id) ?? 0,
      reviewNote: row.reviewNote,
    }
  })

  const availableModules = SIC_MODULES.filter(def => !purchasedKinds.has(def.id)).map(def => ({
    moduleKind: def.id,
    title: def.title,
    summary: def.summary,
    priceChf: def.priceChf,
  }))

  return {
    email,
    certificateCode: cert.certificateCode,
    status: cert.status,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt.toISOString(),
    purchasedModules,
    availableModules,
  }
}

export function sicModuleTitle(id: SicModuleId): string {
  return getSicModule(id).title
}
