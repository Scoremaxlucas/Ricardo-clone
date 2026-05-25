import { authOptions } from '@/lib/auth'
import {
  buildCertificateSnapshotFields,
  checkCertificateEligibility,
  generateCertificateCode,
  parseCreditResult,
} from '@/lib/certificate/issueCertificate'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })
  }

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile) {
    return NextResponse.json({ message: 'Profil nicht gefunden' }, { status: 404 })
  }

  const elig = checkCertificateEligibility(profile)
  if (!elig.eligible) {
    return NextResponse.json({ message: 'Voraussetzungen nicht erfüllt', reason: elig.reason }, { status: 403 })
  }

  const now = new Date()
  const expiresAt = profile.creditCheckExpiresAt!
  const creditResult = parseCreditResult(profile.creditCheckResult)

  const existing = await prisma.helvendaCertificate.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { issuedAt: 'desc' },
  })

  if (existing && existing.expiresAt > now) {
    return NextResponse.json({
      success: true,
      certificate: serializeCert(existing),
      reused: true,
    })
  }

  let code = generateCertificateCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.helvendaCertificate.findUnique({ where: { certificateCode: code } })
    if (!clash) break
    code = generateCertificateCode()
  }

  const nextVersion = (existing?.version ?? 0) + 1

  const snap = buildCertificateSnapshotFields({
    profile,
    creditResult,
    certificateCode: code,
    version: nextVersion,
    expiresAt,
  })

  const cantonFromResult = creditResult?.canton?.trim().toUpperCase()
  const verifiedCreditCheckCanton =
    snap.verifiedCreditCheckCanton === 'CH' || !snap.verifiedCreditCheckCanton?.trim()
      ? cantonFromResult && cantonFromResult !== 'CH'
        ? cantonFromResult.slice(0, 8)
        : '—'
      : snap.verifiedCreditCheckCanton

  try {
    const created = await prisma.$transaction(async tx => {
      await tx.helvendaCertificate.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED' },
      })

      return tx.helvendaCertificate.create({
        data: {
          userId,
          tenantProfileId: profile.id,
          certificateCode: snap.certificateCode,
          version: snap.version,
          verifiedFirstName: snap.verifiedFirstName,
          verifiedLastName: snap.verifiedLastName,
          verifiedAddress: snap.verifiedAddress,
          verifiedCity: snap.verifiedCity,
          verifiedZip: snap.verifiedZip,
          verifiedHousingSituation: snap.verifiedHousingSituation,
          verifiedHousingSince: snap.verifiedHousingSince,
          verifiedEmploymentStatus: snap.verifiedEmploymentStatus,
          verifiedEmployer: snap.verifiedEmployer,
          verifiedIncomeCategory: snap.verifiedIncomeCategory,
          verifiedCreditCheckStatus: snap.verifiedCreditCheckStatus,
          verifiedCreditCheckDate: snap.verifiedCreditCheckDate,
          verifiedCreditCheckCanton,
          verifiedCreditEntryCount: snap.verifiedCreditEntryCount,
          incomeQualifiesUpTo: snap.incomeQualifiesUpTo,
          expiresAt: snap.expiresAt,
          status: 'ACTIVE',
        },
      })
    })

    return NextResponse.json({ success: true, certificate: serializeCert(created), reused: false })
  } catch (e) {
    console.error('[certificate/issue]', e)
    return NextResponse.json({ message: 'Ausstellung fehlgeschlagen' }, { status: 500 })
  }
}

function serializeCert(row: {
  id: string
  certificateCode: string
  version: number
  issuedAt: Date
  expiresAt: Date
  status: string
  verifiedFirstName: string
  verifiedLastName: string
}) {
  return {
    id: row.id,
    certificateCode: row.certificateCode,
    version: row.version,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status: row.status,
    holderName: `${row.verifiedFirstName} ${row.verifiedLastName}`.trim(),
  }
}
