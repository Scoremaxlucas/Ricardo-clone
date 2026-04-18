import { HousingMatchStatus, MatchPropertyStatus, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { evaluateMatch } from './evaluate-match'
import { parseLandlordRules } from './landlord-rules'
import type { PropertyMatchingInput, SeekerMatchingInput } from './types'

function decimalToNumber(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0
  return Number(d)
}

function hasPetsFromHousehold(petsDescription: string | null | undefined): boolean {
  return Boolean(petsDescription?.trim())
}

function toSeekerInput(
  search: {
    cantonPreference: string | null
    postalCodesWanted: string | null
    budgetMin: number | null
    budgetMax: number | null
    minRooms: Prisma.Decimal | null
    maxRooms: Prisma.Decimal | null
    moveInEarliest: Date | null
    moveInLatest: Date | null
  } | null,
  household: { petsDescription: string | null } | null
): SeekerMatchingInput {
  return {
    cantonPreference: search?.cantonPreference ?? null,
    postalCodesWanted: search?.postalCodesWanted ?? null,
    budgetMin: search?.budgetMin ?? null,
    budgetMax: search?.budgetMax ?? null,
    minRooms: search?.minRooms != null ? decimalToNumber(search.minRooms) : null,
    maxRooms: search?.maxRooms != null ? decimalToNumber(search.maxRooms) : null,
    moveInEarliest: search?.moveInEarliest ?? null,
    moveInLatest: search?.moveInLatest ?? null,
    hasPets: hasPetsFromHousehold(household?.petsDescription),
  }
}

function toPropertyInput(p: {
  id: string
  canton: string
  zip: string
  rooms: Prisma.Decimal
  rentPerMonth: number
  availableFrom: Date | null
  status: MatchPropertyStatus
}): PropertyMatchingInput {
  return {
    id: p.id,
    canton: p.canton,
    zip: p.zip,
    rooms: decimalToNumber(p.rooms),
    rentPerMonth: p.rentPerMonth,
    availableFrom: p.availableFrom,
    status: p.status as PropertyMatchingInput['status'],
  }
}

async function upsertOneMatch(
  tx: Prisma.TransactionClient,
  seekerProfileId: string,
  property: {
    id: string
    canton: string
    zip: string
    rooms: Prisma.Decimal
    rentPerMonth: number
    availableFrom: Date | null
    status: MatchPropertyStatus
    rulesJson: Prisma.JsonValue | null
  },
  seekerInput: SeekerMatchingInput
) {
  const propIn = toPropertyInput(property)
  const rules = parseLandlordRules(property.rulesJson)
  const r = evaluateMatch(seekerInput, propIn, rules)
  const status = r.hardFailed ? HousingMatchStatus.hard_rejected : HousingMatchStatus.active
  const now = new Date()

  const match = await tx.housingMatch.upsert({
    where: {
      seekerProfileId_propertyId: {
        seekerProfileId,
        propertyId: property.id,
      },
    },
    create: {
      seekerProfileId,
      propertyId: property.id,
      score: r.score,
      hardFailed: r.hardFailed,
      status,
      computedAt: now,
      updatedAt: now,
    },
    update: {
      score: r.score,
      hardFailed: r.hardFailed,
      status,
      computedAt: now,
      updatedAt: now,
    },
  })

  await tx.housingMatchReason.deleteMany({ where: { matchId: match.id } })
  if (r.reasons.length > 0) {
    await tx.housingMatchReason.createMany({
      data: r.reasons.map(x => ({
        matchId: match.id,
        code: x.code,
        detail: x.detail ?? null,
      })),
    })
  }
}

/**
 * Alle aktiven Objekte gegen ein Suchprofil neu bewerten; Treffer zu inaktiven Objekten → `stale`.
 */
export async function recomputeMatchesForSeeker(seekerProfileId: string): Promise<void> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { id: seekerProfileId },
    include: { searchProfile: true, household: true },
  })
  if (!profile) return

  const seekerInput = toSeekerInput(profile.searchProfile, profile.household)

  const properties = await prisma.matchingProperty.findMany({
    where: { status: MatchPropertyStatus.active },
    select: {
      id: true,
      canton: true,
      zip: true,
      rooms: true,
      rentPerMonth: true,
      availableFrom: true,
      status: true,
      rulesJson: true,
    },
  })

  const activeIds = properties.map(p => p.id)

  await prisma.$transaction(async tx => {
    if (activeIds.length === 0) {
      await tx.housingMatch.updateMany({
        where: { seekerProfileId },
        data: { status: HousingMatchStatus.stale, updatedAt: new Date() },
      })
      return
    }
    for (const property of properties) {
      await upsertOneMatch(tx, seekerProfileId, property, seekerInput)
    }
    await tx.housingMatch.updateMany({
      where: {
        seekerProfileId,
        propertyId: { notIn: activeIds },
        status: { not: HousingMatchStatus.stale },
      },
      data: { status: HousingMatchStatus.stale, updatedAt: new Date() },
    })
  })
}

/**
 * Ein Objekt gegen alle Suchprofile mit hinterlegtem `SeekerSearchProfile` bewerten;
 * übrige Match-Zeilen für dieses Objekt → `stale`.
 */
export async function recomputeMatchesForProperty(propertyId: string): Promise<void> {
  const property = await prisma.matchingProperty.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      canton: true,
      zip: true,
      rooms: true,
      rentPerMonth: true,
      availableFrom: true,
      status: true,
      rulesJson: true,
    },
  })
  if (!property) return

  const seekers = await prisma.seekerProfile.findMany({
    where: { searchProfile: { isNot: null } },
    include: { searchProfile: true, household: true },
  })

  const seekerIds = seekers.map(s => s.id)

  await prisma.$transaction(async tx => {
    if (seekerIds.length === 0) {
      await tx.housingMatch.updateMany({
        where: { propertyId },
        data: { status: HousingMatchStatus.stale, updatedAt: new Date() },
      })
      return
    }
    for (const sp of seekers) {
      const seekerInput = toSeekerInput(sp.searchProfile!, sp.household)
      await upsertOneMatch(tx, sp.id, property, seekerInput)
    }
    await tx.housingMatch.updateMany({
      where: {
        propertyId,
        seekerProfileId: { notIn: seekerIds },
        status: { not: HousingMatchStatus.stale },
      },
      data: { status: HousingMatchStatus.stale, updatedAt: new Date() },
    })
  })
}
