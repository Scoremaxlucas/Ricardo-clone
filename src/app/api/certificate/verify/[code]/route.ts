import { isBotUserAgent } from '@/lib/http/is-bot'
import { housingSinceLabelDe, housingSituationLabelDe } from '@/lib/tenant-profile/housing'
import { employmentSummaryDe, incomeCategoryMonthlyLabelDe } from '@/lib/tenant-profile/labels'
import { prisma } from '@/lib/prisma'
import type { CurrentHousingSituation, EmploymentStatus, IncomeCategory } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const VERIFY_ANALYTICS_SESSION = 'public-certificate-verify'

function noteVerifyApiOutcome(req: NextRequest, outcome: string) {
  if (isBotUserAgent(req.headers.get('user-agent'))) return
  void prisma.analyticsEvent
    .create({
      data: {
        name: 'certificate_verify',
        sessionId: VERIFY_ANALYTICS_SESSION,
        userId: null,
        path: '/api/certificate/verify',
        metadata: JSON.stringify({ outcome }),
      },
    })
    .catch(() => {})
}

function normalizeCode(raw: string): string {
  return decodeURIComponent(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params
  const certificateCode = normalizeCode(raw)
  if (!certificateCode || !certificateCode.startsWith('HLV-')) {
    noteVerifyApiOutcome(req, 'INVALID_CODE')
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  const row = await prisma.helvendaCertificate.findUnique({
    where: { certificateCode },
  })

  if (!row) {
    noteVerifyApiOutcome(req, 'NOT_FOUND')
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  if (row.status === 'REVOKED') {
    noteVerifyApiOutcome(req, 'REVOKED')
    return NextResponse.json({ valid: false, reason: 'REVOKED' as const })
  }

  if (row.status === 'SUPERSEDED') {
    noteVerifyApiOutcome(req, 'SUPERSEDED')
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  const now = new Date()
  const expiredByDate = row.expiresAt < now
  const expiredByStatus = row.status === 'EXPIRED'

  if (expiredByStatus || expiredByDate) {
    noteVerifyApiOutcome(req, 'EXPIRED')
    return NextResponse.json({
      valid: false,
      reason: 'EXPIRED' as const,
      expiredAt: row.expiresAt.toISOString(),
      certificate: serializeVerifyCertificate(row),
    })
  }

  await prisma.helvendaCertificate.update({
    where: { id: row.id },
    data: {
      verificationCount: { increment: 1 },
      lastVerifiedAt: now,
    },
  })

  noteVerifyApiOutcome(req, 'VALID')

  return NextResponse.json({
    valid: true,
    certificate: serializeVerifyCertificate(row),
  })
}

function serializeVerifyCertificate(row: {
  certificateCode: string
  issuedAt: Date
  expiresAt: Date
  verifiedFirstName: string
  verifiedLastName: string
  verifiedAddress: string
  verifiedZip: string
  verifiedCity: string
  verifiedHousingSituation: CurrentHousingSituation | null
  verifiedHousingSince: Date | null
  verifiedEmploymentStatus: string
  verifiedEmployer: string | null
  verifiedIncomeCategory: string
  incomeQualifiesUpTo: number
  verifiedCreditCheckStatus: string
  verifiedCreditCheckDate: Date
  verifiedCreditCheckCanton: string
}) {
  const incomeCategory = row.verifiedIncomeCategory as IncomeCategory
  const incomeLabel = incomeCategoryMonthlyLabelDe(incomeCategory)
  const empLine = employmentSummaryDe(
    row.verifiedEmploymentStatus as EmploymentStatus,
    row.verifiedEmployer,
    null,
    null
  )
  const housingSituation = row.verifiedHousingSituation
  const housingLine =
    housingSituation ?
      `${housingSituationLabelDe(housingSituation)}${
        row.verifiedHousingSince ?
          ` · an dieser Adresse seit ${housingSinceLabelDe(row.verifiedHousingSince)}`
        : ''
      }`
    : null
  const addressLine = `${row.verifiedAddress}, ${row.verifiedZip} ${row.verifiedCity}`.trim()

  return {
    certificateCode: row.certificateCode,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    holderName: `${row.verifiedFirstName} ${row.verifiedLastName}`.trim(),
    employmentLine: empLine,
    housingLine,
    addressLine,
    incomeCategory: incomeLabel,
    incomeQualifiesUpTo: row.incomeQualifiesUpTo,
    creditCheckStatus: row.verifiedCreditCheckStatus,
    creditCheckDate: row.verifiedCreditCheckDate.toISOString(),
    creditCheckCanton: row.verifiedCreditCheckCanton,
  }
}
