import { prisma } from '@/lib/prisma'
import { isSicModuleId, type SicModuleId } from '@/lib/sic/modules'
import { joinHolderName } from '@/lib/sic/dossier'
import { getSicSession } from '@/lib/sic/session-cookie'
import { isSicExpired } from '@/lib/sic/validity'

export type SicLandingAccount = {
  email: string
  certificateCode: string
  status: string
  holderName: string | null
  holderFirstName: string | null
  holderLastName: string | null
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
      expiresAt: true,
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

  const holderFirstName = cert.holderFirstName?.trim() || null
  const holderLastName = cert.holderLastName?.trim() || null
  const holderName = joinHolderName(holderFirstName, holderLastName)

  const status =
    cert.status === 'REVOKED' ? 'REVOKED'
    : cert.status === 'EXPIRED' || isSicExpired(cert.expiresAt) ? 'EXPIRED'
    : cert.status

  return {
    email: session.email,
    certificateCode: cert.certificateCode,
    status,
    holderName,
    holderFirstName,
    holderLastName,
    ownedModules,
    verifiedModules,
  }
}
