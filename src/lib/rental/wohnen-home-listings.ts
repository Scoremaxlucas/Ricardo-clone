import { RentalListingStatus } from '@prisma/client'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import { prisma } from '@/lib/prisma'

export type WohnenHomeListingCard = {
  id: string
  title: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  requiresCreditCheck: boolean
  createdAt: Date
  availableFrom: Date
  photos: string[]
}

export async function loadWohnenHomeListings(limit = 6): Promise<WohnenHomeListingCard[]> {
  const rows = await prisma.rentalListing.findMany({
    where: { status: RentalListingStatus.active },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      city: true,
      canton: true,
      rooms: true,
      areaSqm: true,
      floor: true,
      rentPerMonth: true,
      utilitiesPerMonth: true,
      requiresCreditCheck: true,
      createdAt: true,
      availableFrom: true,
      photos: true,
    },
  })

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    city: r.city,
    canton: r.canton,
    rooms: Number(r.rooms),
    areaSqm: r.areaSqm,
    floor: r.floor,
    rentPerMonth: r.rentPerMonth,
    utilitiesPerMonth: r.utilitiesPerMonth,
    requiresCreditCheck: r.requiresCreditCheck,
    createdAt: r.createdAt,
    availableFrom: r.availableFrom,
    photos: parseRentalListingPhotosJson(r.photos),
  }))
}
