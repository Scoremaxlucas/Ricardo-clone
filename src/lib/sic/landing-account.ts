import { prisma } from '@/lib/prisma'
import { isSicModuleId, type SicModuleId } from '@/lib/sic/modules'
import { getSicSession } from '@/lib/sic/session-cookie'

export type SicLandingAccount = {
  email: string
  certificateCode: string
  status: string
  holderName: string | null
  ownedModules: SicModuleId[]
  verifiedModules: SicModuleId[]
}

/** Session + Zertifikat für Returning-User-UX auf der Landing. */
export async function getSicLandingAccount(): Promise<SicLandingAccount | null> {
  const session = getSicSession()
  if (!session) return null

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      certificateCode: true,
      status: true,
      holderFirstName: true,
      holderLastName: true,
      modules: { select: { moduleKind: true, status: true } },
    },
  })
  if (!cert) return null

  const ownedModules = cert.modules
    .map(m => m.moduleKind)
    .filter(isSicModuleId)

  const verifiedModules = cert.modules
    .filter(m => m.status === 'VERIFIED' && isSicModuleId(m.moduleKind))
    .map(m => m.moduleKind)

  const holderName = `${cert.holderFirstName ?? ''} ${cert.holderLastName ?? ''}`.trim() || null

  return {
    email: session.email,
    certificateCode: cert.certificateCode,
    status: cert.status,
    holderName,
    ownedModules,
    verifiedModules,
  }
}
