import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })
  }

  const now = new Date()
  const cert = await prisma.helvendaCertificate.findFirst({
    where: { userId, status: 'ACTIVE', expiresAt: { gt: now } },
    orderBy: { issuedAt: 'desc' },
  })

  if (!cert) {
    return NextResponse.json({ certificate: null })
  }

  return NextResponse.json({
    certificate: {
      id: cert.id,
      certificateCode: cert.certificateCode,
      version: cert.version,
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt.toISOString(),
      status: cert.status,
      verificationCount: cert.verificationCount,
      holderName: `${cert.verifiedFirstName} ${cert.verifiedLastName}`.trim(),
    },
  })
}
