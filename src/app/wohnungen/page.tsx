import { WohnungenListingsFeed } from '@/components/rental/WohnungenListingsFeed'
import { WohnungenSearchFilters } from '@/components/rental/WohnungenSearchFilters'
import { authOptions } from '@/lib/auth'
import { hasAnyTenantPreferences } from '@/lib/matching/tenant-preferences-match'
import { prisma } from '@/lib/prisma'
import { decideRentalMatchRollout } from '@/lib/rental/match-rollout'
import { countActiveRentalListings } from '@/lib/rental/rental-listings-public'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
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
  const hasExplicitMode = searchParams.mode != null

  if (!hasExplicitMode) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? null
    if (userId) {
      const [user, profile] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        }),
        prisma.tenantProfile.findUnique({
          where: { userId },
          select: {
            preferredCanton: true,
            preferredPostalCodes: true,
            preferredBudgetMin: true,
            preferredBudgetMax: true,
            preferredMinRooms: true,
            preferredMaxRooms: true,
            preferredMoveInEarliest: true,
            preferredMoveInLatest: true,
          },
        }),
      ])

      const rollout = decideRentalMatchRollout({
        userId,
        isAdmin: Boolean(user?.isAdmin),
      })
      if (rollout.enabled && hasAnyTenantPreferences(profile)) {
        const nextParams = new URLSearchParams()
        for (const [key, value] of Object.entries(searchParams)) {
          if (value == null || key === 'mode') continue
          if (Array.isArray(value)) {
            for (const item of value) nextParams.append(key, item)
          } else {
            nextParams.set(key, value)
          }
        }
        nextParams.set('mode', 'match')
        redirect(`/wohnungen?${nextParams.toString()}`)
      }
    }
  }

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
