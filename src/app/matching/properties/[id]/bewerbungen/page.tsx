import { LandlordAccessDenied } from '@/components/rental/LandlordAccessDenied'
import {
  LandlordListingApplicationsClient,
  type LandlordApplicationRow,
} from '@/components/rental/LandlordListingApplicationsClient'
import { authOptions } from '@/lib/auth'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Bewerbungen',
    description: `Bewerbungen für Inserat ${id}.`,
  }
}

export default async function LandlordListingApplicationsPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/properties/${id}/bewerbungen`))
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

  const apps = await prisma.rentalApplication.findMany({
    where: { rentalListingId: listing.id },
    orderBy: { createdAt: 'desc' },
    include: {
      tenantProfile: true,
      applicant: { select: { email: true, phone: true } },
    },
  })

  const thumbUrls = parseRentalListingPhotosJson(listing.photos)

  const rows: LandlordApplicationRow[] = apps.map(a => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    status: a.status,
    message: a.message,
    rejectedAt: a.rejectedAt?.toISOString() ?? null,
    viewingRequestedAt: a.viewingRequestedAt?.toISOString() ?? null,
    viewingDate: a.viewingDate?.toISOString() ?? null,
    creditCheckResult: a.creditCheckResult ?? a.tenantProfile?.creditCheckResult ?? null,
    tenant: a.tenantProfile
      ? {
          firstName: a.tenantProfile.firstName,
          lastName: a.tenantProfile.lastName,
          employmentStatus: a.tenantProfile.employmentStatus,
          employer: a.tenantProfile.employer,
          jobTitle: a.tenantProfile.jobTitle,
          employedSince: a.tenantProfile.employedSince?.toISOString() ?? null,
          monthlyIncomeCategory: a.tenantProfile.monthlyIncomeCategory,
          householdTotalPersons: a.tenantProfile.householdTotalPersons,
          householdChildrenCount: a.tenantProfile.householdChildrenCount,
          declaresNonSmoker: a.tenantProfile.declaresNonSmoker,
          householdPets: a.tenantProfile.householdPets,
          referenceName: a.tenantProfile.referenceName,
          contactPhone:
            a.tenantProfile.contactPhone?.trim() || a.applicant.phone?.trim() || null,
          contactEmail:
            a.tenantProfile.applicationEmail?.trim() || a.applicant.email || null,
        }
      : null,
  }))

  const listingHead = {
    id: listing.id,
    title: listing.title,
    addressLine: formatRentalListingAddress({
      address: listing.address,
      zip: listing.zip,
      city: listing.city,
    }),
    rentPerMonth: listing.rentPerMonth,
    thumbUrl: thumbUrls[0] ?? null,
  }

  return <LandlordListingApplicationsClient listing={listingHead} applications={rows} />
}
