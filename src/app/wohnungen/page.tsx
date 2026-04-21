import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { WohnungenSearchFilters } from '@/components/rental/WohnungenSearchFilters'
import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import {
  countActiveRentalListings,
  fetchActiveRentalListingsFiltered,
  rentalListingRowToCardData,
} from '@/lib/rental/rental-listings-public'
import { Building2, Search } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Wohnungen mieten in der Schweiz — Helvenda Wohnungen',
    description:
      'Mietwohnungen in der ganzen Schweiz — kostenlos suchen, sofort bewerben. Nur verifizierte Inserate mit Betreibungsregister-Check.',
  }
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

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mietwohnungen</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Aktive Inserate auf Helvenda — nach Kanton, Zimmerzahl, Budget und Einzugsdatum filtern.
        </p>

        {globalEmpty ? (
          <div className="mt-16">
            <WohnenEmptyState
              icon={Building2}
              title="Noch keine Wohnungen inseriert"
              description="Sobald Inserate live sind, erscheinen sie hier."
              actionHref="/matching/properties/new"
              actionLabel="Erste Wohnung inserieren"
            />
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

            {filteredEmpty ? (
              <div className="mt-10">
                <WohnenEmptyState
                  icon={Search}
                  title="Keine Wohnungen gefunden"
                  description="Passe die Filter an oder setze sie zurück."
                  actionHref="/wohnungen"
                  actionLabel="Filter zurücksetzen"
                />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map(row => (
                  <RentalListingCard key={row.id} listing={rentalListingRowToCardData(row)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
