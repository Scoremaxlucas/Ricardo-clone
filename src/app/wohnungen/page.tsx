import { WohnungenListingsFeed } from '@/components/rental/WohnungenListingsFeed'
import { WohnungenSearchFilters } from '@/components/rental/WohnungenSearchFilters'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { countActiveRentalListings } from '@/lib/rental/rental-listings-public'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
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

export default async function WohnungenPage(_: PageProps) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const profile = userId
    ? await prisma.tenantProfile.findUnique({
        where: { userId },
        select: { isComplete: true },
      })
    : null
  const showMatchesBanner = Boolean(userId && profile?.isComplete)
  const activeCount = await countActiveRentalListings()
  return (
    <>
      <Suspense fallback={<div className="h-[52px] border-b border-slate-200 bg-white lg:h-[72px]" />}>
        <WohnungenSearchFilters />
      </Suspense>
      {showMatchesBanner ? (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            <p className="font-medium">✨ Du hast ein verifiziertes Profil — sieh dir deine persönlichen Matches an.</p>
            <Link href="/meine-matches" className="mt-1 inline-flex items-center text-sm font-semibold text-teal-800 hover:underline">
              Meine Matches anzeigen →
            </Link>
          </div>
        </section>
      ) : null}
      <WohnungenListingsFeed activeCount={activeCount} />
    </>
  )
}
