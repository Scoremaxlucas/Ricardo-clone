import { LandlordAccessDenied } from '@/components/rental/LandlordAccessDenied'
import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'
import { authOptions } from '@/lib/auth'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Inserat bearbeiten',
    description: `Miet-Inserat ${id} bearbeiten.`,
  }
}

export default async function BearbeitenLandlordRentalPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/properties/${id}/bearbeiten`))
  }

  const listing = await prisma.rentalListing.findUnique({
    where: { id },
  })

  if (!listing) {
    redirect('/matching/properties')
  }
  if (listing.userId !== userId) {
    return <LandlordAccessDenied />
  }

  const photos = parseRentalListingPhotosJson(listing.photos)
  const initial: RentalListingLandlordInitial = {
    title: listing.title,
    description: listing.description,
    address: listing.address,
    zip: listing.zip,
    city: listing.city,
    canton: listing.canton,
    rooms: listing.rooms,
    areaSqm: listing.areaSqm,
    floor: listing.floor,
    rentPerMonth: listing.rentPerMonth,
    utilitiesPerMonth: listing.utilitiesPerMonth,
    depositAmount: listing.depositAmount,
    availableFrom: listing.availableFrom.toISOString(),
    requiresCreditCheck: listing.requiresCreditCheck,
    photos,
    status: listing.status,
    listingExpiresOn: listing.listingExpiresOn ?? null,
    importedFrom: listing.importedFrom,
    importSource: listing.importSource,
  }

  return <RentalListingLandlordForm mode="edit" listingId={listing.id} initial={initial} />
}
