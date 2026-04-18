import { RentalListingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type WohnenHomeListingCard = {
  id: string
  title: string
  zip: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  requiresCreditCheck: boolean
  createdAt: Date
  firstPhotoUrl: string | null
}

function firstPhotoFromJson(raw: string): string | null {
  try {
    const j = JSON.parse(raw) as unknown
    if (!Array.isArray(j) || j.length === 0) return null
    const u = j[0]
    return typeof u === 'string' && u.startsWith('http') ? u : null
  } catch {
    return null
  }
}

export async function loadWohnenHomeListings(limit = 6): Promise<WohnenHomeListingCard[]> {
  const rows = await prisma.rentalListing.findMany({
    where: { status: RentalListingStatus.active },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      zip: true,
      city: true,
      canton: true,
      rooms: true,
      areaSqm: true,
      floor: true,
      rentPerMonth: true,
      utilitiesPerMonth: true,
      requiresCreditCheck: true,
      createdAt: true,
      photos: true,
    },
  })

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    zip: r.zip,
    city: r.city,
    canton: r.canton,
    rooms: Number(r.rooms),
    areaSqm: r.areaSqm,
    floor: r.floor,
    rentPerMonth: r.rentPerMonth,
    utilitiesPerMonth: r.utilitiesPerMonth,
    requiresCreditCheck: r.requiresCreditCheck,
    createdAt: r.createdAt,
    firstPhotoUrl: firstPhotoFromJson(r.photos),
  }))
}
