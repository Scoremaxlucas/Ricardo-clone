import { RentalListingStatus, type Prisma, type RentalListing } from '@prisma/client'
import type { RentalListingCardData } from '@/components/rental/RentalListingCard'
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
  kanton?: string
  zimmer?: string
  maxmiete?: string
  verfuegbar?: string
}

function parseSearchParams(raw: { [key: string]: string | string[] | undefined }): WohnungenUrlFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined
  return {
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
  >
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
  }
}
