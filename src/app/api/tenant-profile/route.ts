import { authOptions } from '@/lib/auth'
import { employmentSummaryDe, householdPetsLabelDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
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

type TenantProfileWithUser = NonNullable<
  Awaited<ReturnType<typeof prisma.tenantProfile.findUnique>>
> & {
  user?: { email: string } | null
}

function serializeTenantProfile(row: TenantProfileWithUser) {
  const accountEmail = row.user?.email?.trim() ?? ''
  const applicationEmail = row.applicationEmail?.trim() || null
  const contactEmailEffective = (applicationEmail || accountEmail || '').trim() || null
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth.toISOString(),
    currentAddress: row.currentAddress,
    currentZip: row.currentZip,
    currentCity: row.currentCity,
    contactPhone: row.contactPhone ?? '',
    applicationEmail,
    accountEmail,
    contactEmailEffective,
    employmentStatus: row.employmentStatus,
    employer: row.employer,
    jobTitle: row.jobTitle,
    employedSince: row.employedSince?.toISOString() ?? null,
    monthlyIncomeCategory: row.monthlyIncomeCategory,
    householdTotalPersons: row.householdTotalPersons,
    householdChildrenCount: row.householdChildrenCount,
    declaresNonSmoker: row.declaresNonSmoker,
    householdPets: row.householdPets,
    householdPetsLabelDe: householdPetsLabelDe(row.householdPets),
    referenceName: row.referenceName,
    referencePhone: row.referencePhone,
    referenceRelation: row.referenceRelation,
    preferredCanton: row.preferredCanton,
    preferredPostalCodes: row.preferredPostalCodes,
    preferredBudgetMin: row.preferredBudgetMin,
    preferredBudgetMax: row.preferredBudgetMax,
    preferredMinRooms: row.preferredMinRooms,
    preferredMaxRooms: row.preferredMaxRooms,
    preferredMoveInEarliest: row.preferredMoveInEarliest?.toISOString() ?? null,
    preferredMoveInLatest: row.preferredMoveInLatest?.toISOString() ?? null,
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

function existingProfileToPatchPayload(
  row: NonNullable<Awaited<ReturnType<typeof prisma.tenantProfile.findUnique>>>
) {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth.toISOString(),
    currentAddress: row.currentAddress,
    currentZip: row.currentZip,
    currentCity: row.currentCity,
    contactPhone: row.contactPhone ?? '',
    applicationEmail: row.applicationEmail,
    employmentStatus: row.employmentStatus,
    employer: row.employer,
    jobTitle: row.jobTitle,
    employedSinceYear: row.employedSince ? row.employedSince.getUTCFullYear() : null,
    employedSinceMonth: row.employedSince ? row.employedSince.getUTCMonth() + 1 : null,
    monthlyIncomeCategory: row.monthlyIncomeCategory,
    householdTotalPersons: row.householdTotalPersons,
    householdChildrenCount: row.householdChildrenCount,
    declaresNonSmoker: row.declaresNonSmoker,
    householdPets: row.householdPets,
    referenceName: row.referenceName,
    referencePhone: row.referencePhone,
    referenceRelation: row.referenceRelation,
    preferredCanton: row.preferredCanton,
    preferredPostalCodes: row.preferredPostalCodes,
    preferredBudgetMin: row.preferredBudgetMin,
    preferredBudgetMax: row.preferredBudgetMax,
    preferredMinRooms: row.preferredMinRooms,
    preferredMaxRooms: row.preferredMaxRooms,
    preferredMoveInEarliest: row.preferredMoveInEarliest?.toISOString() ?? null,
    preferredMoveInLatest: row.preferredMoveInLatest?.toISOString() ?? null,
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const row = await prisma.tenantProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    })
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
      contactPhone: d.contactPhone,
      applicationEmail: d.applicationEmail,
      employmentStatus: d.employmentStatus,
      employer,
      jobTitle: d.jobTitle || null,
      employedSince,
      monthlyIncomeCategory: d.monthlyIncomeCategory,
      householdTotalPersons: d.householdTotalPersons,
      householdChildrenCount: d.householdChildrenCount,
      declaresNonSmoker: d.declaresNonSmoker,
      householdPets: d.householdPets,
      referenceName: d.referenceName,
      referencePhone: d.referencePhone,
      referenceRelation: d.referenceRelation,
      preferredCanton: d.preferredCanton ?? null,
      preferredPostalCodes: d.preferredPostalCodes ?? null,
      preferredBudgetMin: d.preferredBudgetMin ?? null,
      preferredBudgetMax: d.preferredBudgetMax ?? null,
      preferredMinRooms: d.preferredMinRooms ?? null,
      preferredMaxRooms: d.preferredMaxRooms ?? null,
      preferredMoveInEarliest: d.preferredMoveInEarliest ? new Date(d.preferredMoveInEarliest) : null,
      preferredMoveInLatest: d.preferredMoveInLatest ? new Date(d.preferredMoveInLatest) : null,
      isComplete: setComplete,
    },
    update: {
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: new Date(d.dateOfBirth),
      currentAddress: d.currentAddress,
      currentZip: d.currentZip,
      currentCity: d.currentCity,
      contactPhone: d.contactPhone,
      applicationEmail: d.applicationEmail,
      employmentStatus: d.employmentStatus,
      employer,
      jobTitle: d.jobTitle || null,
      employedSince,
      monthlyIncomeCategory: d.monthlyIncomeCategory,
      householdTotalPersons: d.householdTotalPersons,
      householdChildrenCount: d.householdChildrenCount,
      declaresNonSmoker: d.declaresNonSmoker,
      householdPets: d.householdPets,
      referenceName: d.referenceName,
      referencePhone: d.referencePhone,
      referenceRelation: d.referenceRelation,
      preferredCanton: d.preferredCanton ?? null,
      preferredPostalCodes: d.preferredPostalCodes ?? null,
      preferredBudgetMin: d.preferredBudgetMin ?? null,
      preferredBudgetMax: d.preferredBudgetMax ?? null,
      preferredMinRooms: d.preferredMinRooms ?? null,
      preferredMaxRooms: d.preferredMaxRooms ?? null,
      preferredMoveInEarliest: d.preferredMoveInEarliest ? new Date(d.preferredMoveInEarliest) : null,
      preferredMoveInLatest: d.preferredMoveInLatest ? new Date(d.preferredMoveInLatest) : null,
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Ungültiger Request-Body' }, { status: 400 })
    }

    const merged = {
      ...existingProfileToPatchPayload(existing),
      ...(body as Record<string, unknown>),
    }

    // Nach jedem erfolgreichen PATCH Profil als vollständig markieren (vorher blieb isComplete bei false hängen).
    return upsertProfileData(userId, merged, true)
  } catch (e: unknown) {
    console.error('[tenant-profile PATCH]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
