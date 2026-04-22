import { RentalListingStatus, type Prisma, type RentalListing } from '@prisma/client'
import type { RentalListingCardData } from '@/components/rental/RentalListingCard'
import { evaluateMatch, parsePostalCodesList } from '@/lib/matching/evaluate-match'
import { prisma } from '@/lib/prisma'

export function parseRentalListingPhotosJson(raw: string): string[] {
  try {
    const j = JSON.parse(raw) as unknown
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export type WohnungenUrlFilters = {
  mode?: 'all' | 'match'
  kanton?: string
  zimmer?: string
  maxmiete?: string
  verfuegbar?: string
}

function parseSearchParams(raw: { [key: string]: string | string[] | undefined }): WohnungenUrlFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined
  return {
    mode: one(raw.mode) === 'match' ? 'match' : 'all',
    kanton: one(raw.kanton),
    zimmer: one(raw.zimmer),
    maxmiete: one(raw.maxmiete),
    verfuegbar: one(raw.verfuegbar),
  }
}

export function rentalFiltersFromSearchParams(
  searchParams: { [key: string]: string | string[] | undefined }
): WohnungenUrlFilters {
  return parseSearchParams(searchParams)
}

export async function fetchActiveRentalListingsFiltered(
  searchParams: { [key: string]: string | string[] | undefined }
) {
  const f = rentalFiltersFromSearchParams(searchParams)
  const where: Prisma.RentalListingWhereInput = {
    status: RentalListingStatus.active,
  }

  if (f.kanton) {
    where.canton = f.kanton.toUpperCase()
  }

  if (f.zimmer) {
    const min = f.zimmer === '5plus' ? 5 : Number.parseFloat(f.zimmer)
    if (!Number.isNaN(min) && min > 0) {
      where.rooms = { gte: min }
    }
  }

  if (f.maxmiete && f.maxmiete !== '5000plus') {
    const cap = Number.parseInt(f.maxmiete, 10)
    if (!Number.isNaN(cap) && cap > 0) {
      where.rentPerMonth = { lte: cap }
    }
  }

  if (f.verfuegbar) {
    const d = new Date(f.verfuegbar)
    if (!Number.isNaN(d.getTime())) {
      where.availableFrom = { lte: d }
    }
  }

  return prisma.rentalListing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

function preferenceCompleteness(profile: {
  preferredCanton: string | null
  preferredPostalCodes: string | null
  preferredBudgetMin: number | null
  preferredBudgetMax: number | null
  preferredMinRooms: number | null
  preferredMaxRooms: number | null
  preferredMoveInEarliest: Date | null
  preferredMoveInLatest: Date | null
} | null): boolean {
  if (!profile) return false
  return Boolean(
    profile.preferredCanton ||
      parsePostalCodesList(profile.preferredPostalCodes).length > 0 ||
      profile.preferredBudgetMin != null ||
      profile.preferredBudgetMax != null ||
      profile.preferredMinRooms != null ||
      profile.preferredMaxRooms != null ||
      profile.preferredMoveInEarliest != null ||
      profile.preferredMoveInLatest != null
  )
}

export type WohnungenMatchMeta = {
  mode: 'all' | 'match'
  isLoggedIn: boolean
  needsPreferences: boolean
  totalMatched: number
}

export type WohnungenListingWithScore = RentalListing & {
  __matchScore?: number
  __matchHighlights?: string[]
}

export async function fetchWohnenListingsForMode(
  searchParams: { [key: string]: string | string[] | undefined },
  userId: string | null
): Promise<{ listings: WohnungenListingWithScore[]; meta: WohnungenMatchMeta }> {
  const filters = rentalFiltersFromSearchParams(searchParams)

  if (filters.mode !== 'match') {
    const listings = await fetchActiveRentalListingsFiltered(searchParams)
    return {
      listings,
      meta: {
        mode: 'all',
        isLoggedIn: Boolean(userId),
        needsPreferences: false,
        totalMatched: listings.length,
      },
    }
  }

  if (!userId) {
    return {
      listings: [],
      meta: {
        mode: 'match',
        isLoggedIn: false,
        needsPreferences: false,
        totalMatched: 0,
      },
    }
  }

  const [profile, listings] = await Promise.all([
    prisma.tenantProfile.findUnique({
      where: { userId },
      select: {
        preferredCanton: true,
        preferredPostalCodes: true,
        preferredBudgetMin: true,
        preferredBudgetMax: true,
        preferredMinRooms: true,
        preferredMaxRooms: true,
        preferredMoveInEarliest: true,
        preferredMoveInLatest: true,
      },
    }),
    fetchActiveRentalListingsFiltered(searchParams),
  ])

  if (!preferenceCompleteness(profile)) {
    return {
      listings: [],
      meta: {
        mode: 'match',
        isLoggedIn: true,
        needsPreferences: true,
        totalMatched: 0,
      },
    }
  }

  const seeker = {
    cantonPreference: profile?.preferredCanton ?? null,
    postalCodesWanted: profile?.preferredPostalCodes ?? null,
    budgetMin: profile?.preferredBudgetMin ?? null,
    budgetMax: profile?.preferredBudgetMax ?? null,
    minRooms: profile?.preferredMinRooms ?? null,
    maxRooms: profile?.preferredMaxRooms ?? null,
    moveInEarliest: profile?.preferredMoveInEarliest ?? null,
    moveInLatest: profile?.preferredMoveInLatest ?? null,
    hasPets: false,
  }

  const ranked: WohnungenListingWithScore[] = []
  for (const l of listings) {
    const r = evaluateMatch(
      seeker,
      {
        id: l.id,
        canton: l.canton,
        zip: l.zip,
        rooms: Number(l.rooms),
        rentPerMonth: l.rentPerMonth,
        availableFrom: l.availableFrom,
        status: l.status === 'active' ? 'active' : 'archived',
      },
      {}
    )
    if (r.hardFailed) continue
    const highlights = r.reasons
      .filter(x => x.kind === 'soft')
      .slice(0, 2)
      .map(x => {
        if (x.code === 'CANTON_MATCH') return 'Kanton passt'
        if (x.code === 'BUDGET_HEADROOM') return 'Im Budget'
        if (x.code === 'ROOMS_FIT') return 'Zimmerzahl passt'
        if (x.code === 'PETS_ALLOWED') return 'Haustiere möglich'
        return x.detail || 'Guter Match'
      })
    ranked.push({
      ...l,
      __matchScore: r.score,
      __matchHighlights: highlights,
    })
  }

  ranked.sort((a, b) => (b.__matchScore ?? 0) - (a.__matchScore ?? 0) || b.createdAt.getTime() - a.createdAt.getTime())

  return {
    listings: ranked,
    meta: {
      mode: 'match',
      isLoggedIn: true,
      needsPreferences: false,
      totalMatched: ranked.length,
    },
  }
}

export async function fetchActiveRentalListingById(id: string) {
  return prisma.rentalListing.findFirst({
    where: { id, status: RentalListingStatus.active },
  })
}

/** Bis zu `take` andere aktive Listings im gleichen Kanton (ohne `excludeId`), pseudo-zufällig gemischt. */
export async function fetchSimilarRentalListings(canton: string, excludeId: string, take = 3) {
  const rows = await prisma.rentalListing.findMany({
    where: {
      status: RentalListingStatus.active,
      canton: canton.toUpperCase(),
      NOT: { id: excludeId },
    },
    take: 24,
    orderBy: { createdAt: 'desc' },
  })
  const shuffled = [...rows].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, take)
}

export async function countActiveRentalListings() {
  return prisma.rentalListing.count({
    where: { status: RentalListingStatus.active },
  })
}

export function rentalListingRowToCardData(
  row: Pick<
    RentalListing,
    | 'id'
    | 'title'
    | 'city'
    | 'canton'
    | 'rooms'
    | 'areaSqm'
    | 'floor'
    | 'rentPerMonth'
    | 'utilitiesPerMonth'
    | 'availableFrom'
    | 'photos'
    | 'requiresCreditCheck'
    | 'createdAt'
  > & {
    __matchScore?: number
    __matchHighlights?: string[]
  }
): RentalListingCardData {
  const rooms = Number(row.rooms)
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    canton: row.canton,
    rooms: Number.isFinite(rooms) ? rooms : 0,
    areaSqm: row.areaSqm,
    floor: row.floor,
    rentPerMonth: row.rentPerMonth,
    utilitiesPerMonth: row.utilitiesPerMonth,
    availableFrom: row.availableFrom,
    photos: parseRentalListingPhotosJson(row.photos),
    requiresCreditCheck: row.requiresCreditCheck,
    createdAt: row.createdAt,
    matchScore: row.__matchScore,
    matchHighlights: row.__matchHighlights,
  }
}
