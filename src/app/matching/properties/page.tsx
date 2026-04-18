import { LandlordRentalListingsClient } from '@/components/rental/LandlordRentalListingsClient'
import { authOptions } from '@/lib/auth'
import { loadLandlordRentalListingsDashboard } from '@/lib/rental/landlord-rental-listings'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Meine Inserate',
  description: 'Deine Miet-Inserate auf Helvenda Wohnungen verwalten.',
}

export default async function LandlordRentalPropertiesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/properties'))
  }

  const dash = await loadLandlordRentalListingsDashboard(userId)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Vermieter</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Meine Inserate</h1>
        </div>
        <Link
          href="/matching/properties/new"
          className="inline-flex justify-center rounded-xl bg-[#18a87c] px-5 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
        >
          Neues Inserat erstellen
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Aktiv</p>
          <p className="mt-1 text-2xl font-bold text-teal-900">{dash.activeCount}</p>
          <p className="text-sm text-teal-800">Aktive Inserate</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Neu</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{dash.neueApplicationsTotal}</p>
          <p className="text-sm text-blue-900">Neue Bewerbungen</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Vermietet</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{dash.rentedCount}</p>
          <p className="text-sm text-slate-700">Vermietete Objekte</p>
        </div>
      </div>

      <LandlordRentalListingsClient initialListings={dash.listings} />
    </main>
  )
}
