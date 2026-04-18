import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { WohnungenSearchFilters } from '@/components/rental/WohnungenSearchFilters'
import {
  countActiveRentalListings,
  fetchActiveRentalListingsFiltered,
  rentalListingRowToCardData,
} from '@/lib/rental/rental-listings-public'
import { Building2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Wohnungen suchen | Helvenda Wohnungen',
  description: 'Aktive Mietwohnungen in der Schweiz filtern und kostenlos bewerben — Helvenda Wohnungen.',
}

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function WohnungenPage({ searchParams }: PageProps) {
  const listings = await fetchActiveRentalListingsFiltered(searchParams)

  let anyActiveWhenEmpty = 0
  if (listings.length === 0) {
    anyActiveWhenEmpty = await countActiveRentalListings()
  }

  const globalEmpty = listings.length === 0 && anyActiveWhenEmpty === 0
  const filteredEmpty = listings.length === 0 && anyActiveWhenEmpty > 0

  return (
    <>
      <Suspense fallback={<div className="h-[52px] border-b border-slate-200 bg-white lg:h-[72px]" />}>
        <WohnungenSearchFilters />
      </Suspense>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mietwohnungen</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Aktive Inserate auf Helvenda — nach Kanton, Zimmerzahl, Budget und Einzugsdatum filtern.
        </p>

        {globalEmpty ? (
          <div className="mx-auto mt-16 flex max-w-md flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <Building2 className="h-14 w-14 text-slate-300" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-slate-800">Noch keine Wohnungen inseriert</p>
            <Link
              href="/matching/properties/new"
              className="mt-6 inline-flex rounded-xl bg-[#18a87c] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Erste Wohnung inserieren →
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm font-medium text-slate-700">
              {filteredEmpty ? (
                <>Keine Wohnungen gefunden — Filter anpassen oder später nochmal schauen.</>
              ) : (
                <>
                  {listings.length} Wohnung{listings.length === 1 ? '' : 'en'} gefunden
                </>
              )}
            </p>

            {!filteredEmpty ? (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map(row => (
                  <RentalListingCard key={row.id} listing={rentalListingRowToCardData(row)} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  )
}
