import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Inserat bearbeiten (${id.slice(0, 8)}…)`,
    robots: { index: false, follow: false },
  }
}

function sourceDescription(importSource: string, importedFrom: string | null): string {
  if (importSource === 'IMPORTED') return `Import${importedFrom ? `: ${importedFrom}` : ''}`
  if (importSource === 'PARTNER') return `Partner${importedFrom ? `: ${importedFrom}` : ''}`
  return 'Eigenes Inserat / Vermieter'
}

export default async function AdminEditListingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/listings'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  const { id } = await params
  const listing = await prisma.rentalListing.findFirst({ where: { id } })
  if (!listing) notFound()

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
    landlordNotifyEmail: listing.landlordNotifyEmail ?? null,
    importedFrom: listing.importedFrom,
    importSource: listing.importSource,
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        <p className="font-semibold text-slate-900">Quelle / Herkunft (nur Lesen)</p>
        <p className="mt-1">{sourceDescription(listing.importSource, listing.importedFrom)}</p>
        {listing.importedFrom && listing.importSource !== 'SELF' ?
          <p className="mt-1 break-all text-xs text-slate-600">{listing.importedFrom}</p>
        : null}
      </div>
      <RentalListingLandlordForm
        mode="edit"
        listingId={listing.id}
        initial={initial}
        variant="admin"
        minPhotos={0}
        adminShowAcquisitionFields={false}
        submitApiPath="/api/admin/rental-listings"
        afterSaveRedirect="/admin/listings"
        backHref="/admin/listings"
      />
    </div>
  )
}
