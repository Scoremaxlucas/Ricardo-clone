import { BewerbenClient, type BewerbenListingPreview, type BewerbenTenantPreview } from '@/app/wohnungen/[id]/bewerben/BewerbenClient'
import { QualificationGate } from '@/components/rental/QualificationGate'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { qualifyTenant } from '@/lib/rental/qualifyTenant'
import { fetchActiveRentalListingById, parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchActiveRentalListingById(id)
  if (!listing) return { title: 'Bewerbung | Helvenda Wohnungen' }
  return { title: `Bewerbung — ${listing.title} | Helvenda Wohnungen` }
}

function firstPhotoUrl(photosJson: string): string | null {
  const urls = parseRentalListingPhotosJson(photosJson)
  const u = urls[0]?.trim()
  if (!u) return null
  if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('//')) return u
  return null
}

export default async function WohnungBewerbenPage({ params }: PageProps) {
  const { id: listingId } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/wohnungen/${listingId}/bewerben`))
  }

  const listing = await prisma.rentalListing.findFirst({
    where: { id: listingId, status: 'active' },
  })
  if (!listing) {
    notFound()
  }

  const existing = await prisma.rentalApplication.findFirst({
    where: {
      rentalListingId: listingId,
      applicantUserId: userId,
      status: { in: ['pending_credit_check', 'pending_manual_review', 'approved'] },
    },
  })
  if (existing) {
    redirect('/meine-bewerbungen?already=true')
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!tenantProfile) {
    redirect('/profil/erstellen?next=' + encodeURIComponent(`/wohnungen/${listingId}/bewerben`))
  }
  const qualification = qualifyTenant(tenantProfile, listing)
  if (!qualification.qualified) {
    return (
      <QualificationGate
        issues={qualification.reasons}
        listing={{
          id: listing.id,
          title: listing.title,
          rentPerMonth: listing.rentPerMonth,
          firstPhotoUrl: firstPhotoUrl(listing.photos),
        }}
      />
    )
  }

  const listingPreview: BewerbenListingPreview = {
    id: listing.id,
    title: listing.title,
    address: listing.address,
    zip: listing.zip,
    city: listing.city,
    rooms: Number(listing.rooms),
    areaSqm: listing.areaSqm,
    rentPerMonth: listing.rentPerMonth,
    firstPhotoUrl: firstPhotoUrl(listing.photos),
  }

  const tenantPreview: BewerbenTenantPreview = {
    firstName: tenantProfile.firstName,
    lastName: tenantProfile.lastName,
    employmentStatus: tenantProfile.employmentStatus,
    employer: tenantProfile.employer,
    jobTitle: tenantProfile.jobTitle,
    employedSince: tenantProfile.employedSince?.toISOString() ?? null,
    monthlyIncomeCategory: tenantProfile.monthlyIncomeCategory,
    referenceName: tenantProfile.referenceName,
    referenceRelation: tenantProfile.referenceRelation,
    creditCheckStatus: tenantProfile.creditCheckStatus,
    creditCheckResult: tenantProfile.creditCheckResult,
  }

  return (
    <BewerbenClient listing={listingPreview} tenant={tenantPreview} requiresCreditCheck={listing.requiresCreditCheck} />
  )
}
