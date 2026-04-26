import { ZertifikatClient } from '@/app/zertifikat/ZertifikatClient'
import { checkCertificateEligibility } from '@/lib/certificate/issueCertificate'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Qualitätsnachweis',
  description: 'Helvenda Qualitätsnachweis ausstellen.',
  robots: { index: false, follow: false },
}

export default async function ZertifikatPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/zertifikat'))
  }

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile) {
    redirect('/profil/erstellen')
  }

  const now = new Date()
  const active = await prisma.helvendaCertificate.findFirst({
    where: { userId, status: 'ACTIVE', expiresAt: { gt: now } },
    orderBy: { issuedAt: 'desc' },
    select: { certificateCode: true },
  })

  const elig = checkCertificateEligibility(profile)

  return (
    <ZertifikatClient
      creditCheckExpiresAt={profile.creditCheckExpiresAt?.toISOString() ?? null}
      eligible={elig.eligible}
      eligibilityReason={elig.eligible ? undefined : elig.reason}
      initialCertificateCode={active?.certificateCode ?? null}
    />
  )
}
