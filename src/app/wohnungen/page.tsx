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
    <>
      <Suspense fallback={<div className="h-[52px] border-b border-slate-200 bg-white lg:h-[72px]" />}>
        <WohnungenSearchFilters />
      </Suspense>
      <WohnungenListingsFeed activeCount={activeCount} />
    </>
  )
}
