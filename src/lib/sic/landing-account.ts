import { prisma } from '@/lib/prisma'
import { joinHouseholdHolderName } from '@/lib/sic/dossier'
import { isSicCouple } from '@/lib/sic/household'
import { isSicModuleId, type SicModuleId } from '@/lib/sic/modules'
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
      holder2FirstName: true,
      holder2LastName: true,
      householdKind: true,
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
  const holderName = joinHouseholdHolderName({
    firstName: holderFirstName,
    lastName: holderLastName,
    firstName2: cert.holder2FirstName,
    lastName2: cert.holder2LastName,
    couple: isSicCouple(cert.householdKind),
  })

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
