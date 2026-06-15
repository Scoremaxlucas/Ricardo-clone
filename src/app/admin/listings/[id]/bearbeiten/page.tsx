import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { loadExternalLandlordOptions } from '@/lib/external-landlords/admin-options'
import { parseStoredLandlordContact } from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import Link from 'next/link'
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
  const landlordOptions = await loadExternalLandlordOptions()
  const parsedLandlordContact = parseStoredLandlordContact(listing.landlordContact)

  const photos = parseRentalListingPhotosJson(listing.photos)
  const initial: RentalListingLandlordInitial = {
    title: listing.title,
    externalLandlordId: listing.externalLandlordId,
    landlordInternalName: parsedLandlordContact.name,
    landlordInternalContact: parsedLandlordContact.contact,
    landlordInternalNote: parsedLandlordContact.note,
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
    referenceUrl: listing.referenceUrl ?? null,
    monitoringUrl: listing.monitoringUrl ?? null,
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        <p className="font-semibold text-slate-900">Quelle / Herkunft (nur Lesen)</p>
        <p className="mt-1">{sourceDescription(listing.importSource, listing.importedFrom)}</p>
        {listing.importedFrom && listing.importSource !== 'SELF' ?
          <p className="mt-1 break-all text-xs text-slate-600">{listing.importedFrom}</p>
        : null}
        {listing.referenceUrl ?
          <p className="mt-2 break-all text-xs text-slate-600">
            <span className="font-medium text-slate-700">Referenz (intern):</span>{' '}
            <a href={listing.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-800 hover:underline">
              {listing.referenceUrl}
            </a>
            <span className="text-slate-500"> · nur manuell prüfen</span>
          </p>
        : null}
        {listing.monitoringUrl ?
          <p className="mt-1 break-all text-xs text-slate-600">
            <span className="font-medium text-slate-700">Monitoring:</span> {listing.monitoringUrl}
          </p>
        : null}
        {listing.externalLandlordId ?
          <p className="mt-3">
            <Link href={`/admin/landlords/${listing.externalLandlordId}`} className="font-semibold text-teal-800 hover:underline">
              Vermieter-CRM öffnen
            </Link>
          </p>
        : null}
      </div>
      <RentalListingLandlordForm
        mode="edit"
        listingId={listing.id}
        initial={initial}
        variant="admin"
        minPhotos={0}
        adminShowAcquisitionFields={false}
        adminExternalLandlordOptions={landlordOptions}
        submitApiPath="/api/admin/rental-listings"
        afterSaveRedirect="/admin/listings"
        backHref="/admin/listings"
      />
    </div>
  )
}
