import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { prisma } from '@/lib/prisma'
import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function normalizeCode(raw: string): string {
  return decodeURIComponent(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params
  const certificateCode = normalizeCode(raw)
  if (!certificateCode || !certificateCode.startsWith('HLV-')) {
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  const row = await prisma.helvendaCertificate.findUnique({
    where: { certificateCode },
  })

  if (!row) {
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  if (row.status === 'REVOKED') {
    return NextResponse.json({ valid: false, reason: 'REVOKED' as const })
  }

  if (row.status === 'SUPERSEDED') {
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' as const })
  }

  const now = new Date()
  const expiredByDate = row.expiresAt < now
  const expiredByStatus = row.status === 'EXPIRED'

  if (expiredByStatus || expiredByDate) {
    const incomeCategory = row.verifiedIncomeCategory as IncomeCategory
    const incomeLabel = incomeCategoryLabelDe(incomeCategory)
    const empLine = employmentSummaryDe(
      row.verifiedEmploymentStatus as EmploymentStatus,
      row.verifiedEmployer,
      null,
      null
    )
    return NextResponse.json({
      valid: false,
      reason: 'EXPIRED' as const,
      expiredAt: row.expiresAt.toISOString(),
      certificate: {
        certificateCode: row.certificateCode,
        issuedAt: row.issuedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        holderName: `${row.verifiedFirstName} ${row.verifiedLastName}`.trim(),
        employmentLine: empLine,
        incomeCategory: incomeLabel,
        incomeQualifiesUpTo: row.incomeQualifiesUpTo,
        creditCheckStatus: row.verifiedCreditCheckStatus,
        creditCheckDate: row.verifiedCreditCheckDate.toISOString(),
        creditCheckCanton: row.verifiedCreditCheckCanton,
      },
    })
  }

  await prisma.helvendaCertificate.update({
    where: { id: row.id },
    data: {
      verificationCount: { increment: 1 },
      lastVerifiedAt: now,
    },
  })

  const incomeCategory = row.verifiedIncomeCategory as IncomeCategory
  const incomeLabel = incomeCategoryLabelDe(incomeCategory)
  const empLine = employmentSummaryDe(
    row.verifiedEmploymentStatus as EmploymentStatus,
    row.verifiedEmployer,
    null,
    null
  )

  return NextResponse.json({
    valid: true,
    certificate: {
      certificateCode: row.certificateCode,
      issuedAt: row.issuedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      holderName: `${row.verifiedFirstName} ${row.verifiedLastName}`.trim(),
      employmentLine: empLine,
      incomeCategory: incomeLabel,
      incomeQualifiesUpTo: row.incomeQualifiesUpTo,
      creditCheckStatus: row.verifiedCreditCheckStatus,
      creditCheckDate: row.verifiedCreditCheckDate.toISOString(),
      creditCheckCanton: row.verifiedCreditCheckCanton,
    },
  })
}
