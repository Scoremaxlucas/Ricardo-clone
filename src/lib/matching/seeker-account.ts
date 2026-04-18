import { MatchingDocumentSubject } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type SeekerOnboardingSnapshot = {
  seekerProfileId: string
  /** Für Client-Remount nach `router.refresh()` */
  profileUpdatedAt: string
  searchProfile: {
    cantonPreference: string | null
    postalCodesWanted: string | null
    budgetMin: number | null
    budgetMax: number | null
    minRooms: number | null
    maxRooms: number | null
    moveInEarliest: string | null
    moveInLatest: string | null
  } | null
  household: {
    adults: number
    children: number
    petsDescription: string | null
  } | null
  employment: {
    employmentStatus: string | null
    employerName: string | null
  } | null
  financial: {
    monthlyNetIncomeBand: string | null
  } | null
  documents: { id: string; kind: string; status: string; createdAt: string }[]
}

function decimalToNumber(v: { toNumber(): number } | null | undefined): number | null {
  if (v == null) return null
  return v.toNumber()
}

/**
 * Legt ein leeres `SeekerProfile` an, falls noch keins existiert.
 */
export async function ensureSeekerProfileForUser(userId: string): Promise<string> {
  const existing = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await prisma.seekerProfile.create({
    data: { userId },
    select: { id: true },
  })
  return created.id
}

export async function loadSeekerOnboardingSnapshot(userId: string): Promise<SeekerOnboardingSnapshot> {
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  const row = await prisma.seekerProfile.findUniqueOrThrow({
    where: { id: seekerProfileId },
    include: {
      searchProfile: true,
      household: true,
      employment: true,
      financial: true,
    },
  })

  const docs = await prisma.matchingDocument.findMany({
    where: {
      subjectType: MatchingDocumentSubject.seeker_profile,
      subjectId: seekerProfileId,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, kind: true, status: true, createdAt: true },
    take: 30,
  })

  const sp = row.searchProfile
  const hh = row.household
  const em = row.employment
  const fi = row.financial

  return {
    seekerProfileId,
    profileUpdatedAt: row.updatedAt.toISOString(),
    searchProfile: sp
      ? {
          cantonPreference: sp.cantonPreference,
          postalCodesWanted: sp.postalCodesWanted,
          budgetMin: sp.budgetMin,
          budgetMax: sp.budgetMax,
          minRooms: decimalToNumber(sp.minRooms),
          maxRooms: decimalToNumber(sp.maxRooms),
          moveInEarliest: sp.moveInEarliest?.toISOString() ?? null,
          moveInLatest: sp.moveInLatest?.toISOString() ?? null,
        }
      : null,
    household: hh
      ? {
          adults: hh.adults,
          children: hh.children,
          petsDescription: hh.petsDescription,
        }
      : null,
    employment: em
      ? {
          employmentStatus: em.employmentStatus,
          employerName: em.employerName,
        }
      : null,
    financial: fi
      ? {
          monthlyNetIncomeBand: fi.monthlyNetIncomeBand,
        }
      : null,
    documents: docs.map(d => ({
      id: d.id,
      kind: d.kind,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}
