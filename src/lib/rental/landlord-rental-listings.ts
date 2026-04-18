import { prisma } from '@/lib/prisma'
import { RentalApplicationStatus, RentalListingStatus } from '@prisma/client'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'

export type LandlordListingRowSerialized = {
  id: string
  title: string
  address: string
  zip: string
  city: string
  rooms: number
  areaSqm: number
  rentPerMonth: number
  availableFrom: string
  status: RentalListingStatus
  thumbUrl: string | null
  applicationCount: number
  neueApplicationCount: number
}

export type LandlordListingsDashboard = {
  listings: LandlordListingRowSerialized[]
  activeCount: number
  rentedCount: number
  neueApplicationsTotal: number
}

export async function loadLandlordRentalListingsDashboard(userId: string): Promise<LandlordListingsDashboard> {
  const listings = await prisma.rentalListing.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  const ids = listings.map(l => l.id)
  if (ids.length === 0) {
    return { listings: [], activeCount: 0, rentedCount: 0, neueApplicationsTotal: 0 }
  }

  const [totals, neueGroups] = await Promise.all([
    prisma.rentalApplication.groupBy({
      by: ['rentalListingId'],
      where: { rentalListingId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.rentalApplication.groupBy({
      by: ['rentalListingId'],
      where: {
        rentalListingId: { in: ids },
        status: RentalApplicationStatus.approved,
        rejectedAt: null,
        viewingRequestedAt: null,
      },
      _count: { _all: true },
    }),
  ])

  const totalMap = new Map(totals.map(t => [t.rentalListingId, t._count._all]))
  const neueMap = new Map(neueGroups.map(t => [t.rentalListingId, t._count._all]))

  let neueApplicationsTotal = 0
  neueMap.forEach(n => {
    neueApplicationsTotal += n
  })

  const rows: LandlordListingRowSerialized[] = listings.map(l => {
    const urls = parseRentalListingPhotosJson(l.photos)
    return {
      id: l.id,
      title: l.title,
      address: l.address,
      zip: l.zip,
      city: l.city,
      rooms: l.rooms,
      areaSqm: l.areaSqm,
      rentPerMonth: l.rentPerMonth,
      availableFrom: l.availableFrom.toISOString(),
      status: l.status,
      thumbUrl: urls[0] ?? null,
      applicationCount: totalMap.get(l.id) ?? 0,
      neueApplicationCount: neueMap.get(l.id) ?? 0,
    }
  })

  const activeCount = listings.filter(l => l.status === RentalListingStatus.active).length
  const rentedCount = listings.filter(l => l.status === RentalListingStatus.rented).length

  return {
    listings: rows,
    activeCount,
    rentedCount,
    neueApplicationsTotal,
  }
}
