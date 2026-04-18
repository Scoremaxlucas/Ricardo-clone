import { authOptions } from '@/lib/auth'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import {
  employedSinceDateFromParts,
  validateTenantProfilePayload,
} from '@/lib/tenant-profile/validators'
import { prisma } from '@/lib/prisma'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function creditResultFromJson(value: unknown): CreditCheckResult | null {
  if (!value || typeof value !== 'object') return null
  return isCreditCheckResult(value) ? value : null
}

function serializeTenantProfile(row: NonNullable<Awaited<ReturnType<typeof prisma.tenantProfile.findUnique>>>) {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth.toISOString(),
    currentAddress: row.currentAddress,
    currentZip: row.currentZip,
    currentCity: row.currentCity,
    employmentStatus: row.employmentStatus,
    employer: row.employer,
    jobTitle: row.jobTitle,
    employedSince: row.employedSince?.toISOString() ?? null,
    monthlyIncomeCategory: row.monthlyIncomeCategory,
    referenceName: row.referenceName,
    referencePhone: row.referencePhone,
    referenceRelation: row.referenceRelation,
    creditCheckStatus: row.creditCheckStatus,
    creditCheckResult: creditResultFromJson(row.creditCheckResult),
    creditCheckUploadedAt: row.creditCheckUploadedAt?.toISOString() ?? null,
    creditCheckExpiresAt: row.creditCheckExpiresAt?.toISOString() ?? null,
    isComplete: row.isComplete,
    employmentSummaryDe: employmentSummaryDe(
      row.employmentStatus,
      row.employer,
      row.jobTitle,
      row.employedSince
    ),
    incomeCategoryLabelDe: incomeCategoryLabelDe(row.monthlyIncomeCategory),
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const row = await prisma.tenantProfile.findUnique({ where: { userId } })
    if (!row) {
      return NextResponse.json({ profile: null })
    }
    return NextResponse.json({ profile: serializeTenantProfile(row) })
  } catch (e: unknown) {
    console.error('[tenant-profile GET]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}

async function upsertProfileData(userId: string, body: unknown, setComplete: boolean) {
  const v = validateTenantProfilePayload(body)
  if (!v.ok) {
    return NextResponse.json({ message: v.message, field: v.field }, { status: 400 })
  }
  const d = v.data
  const employedSince = employedSinceDateFromParts(d.employedSinceYear ?? null, d.employedSinceMonth ?? null)
  const employer =
    d.employmentStatus === 'EMPLOYED' || d.employmentStatus === 'SELF_EMPLOYED' ? d.employer ?? null : null

  const row = await prisma.tenantProfile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: new Date(d.dateOfBirth),
      currentAddress: d.currentAddress,
      currentZip: d.currentZip,
      currentCity: d.currentCity,
      employmentStatus: d.employmentStatus,
      employer,
      jobTitle: d.jobTitle || null,
      employedSince,
      monthlyIncomeCategory: d.monthlyIncomeCategory,
      referenceName: d.referenceName,
      referencePhone: d.referencePhone,
      referenceRelation: d.referenceRelation,
      isComplete: setComplete,
    },
    update: {
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: new Date(d.dateOfBirth),
      currentAddress: d.currentAddress,
      currentZip: d.currentZip,
      currentCity: d.currentCity,
      employmentStatus: d.employmentStatus,
      employer,
      jobTitle: d.jobTitle || null,
      employedSince,
      monthlyIncomeCategory: d.monthlyIncomeCategory,
      referenceName: d.referenceName,
      referencePhone: d.referencePhone,
      referenceRelation: d.referenceRelation,
      isComplete: setComplete,
    },
  })

  return NextResponse.json({ success: true, profileId: row.id })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    return upsertProfileData(userId, body, true)
  } catch (e: unknown) {
    console.error('[tenant-profile POST]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const existing = await prisma.tenantProfile.findUnique({ where: { userId } })
    if (!existing) {
      return NextResponse.json({ message: 'Profil nicht gefunden' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    return upsertProfileData(userId, body, true)
  } catch (e: unknown) {
    console.error('[tenant-profile PATCH]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
