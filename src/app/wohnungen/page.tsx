import { WohnungenListingsFeed } from '@/components/rental/WohnungenListingsFeed'
import { WohnungenSearchFilters } from '@/components/rental/WohnungenSearchFilters'
import { countActiveRentalListings } from '@/lib/rental/rental-listings-public'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Wohnungen mieten in der Schweiz — Helvenda Wohnungen',
    description:
      'Mietwohnungen in der ganzen Schweiz — kostenlos suchen, sofort bewerben. Nur verifizierte Inserate mit Betreibungsregisterauszug-Check.',
  }
}

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function WohnungenPage(_: PageProps) {
  const activeCount = await countActiveRentalListings()
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200/80" />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[330px] animate-pulse rounded-2xl border border-slate-200/80 bg-white/60" />
            ))}
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 md:pt-10">
        <WohnungenSearchFilters />
        <WohnungenListingsFeed activeCount={activeCount} />
      </div>
    </Suspense>
  )
}
