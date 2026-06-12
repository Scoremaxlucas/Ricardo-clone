import { MeineBewerbungenAlreadyToast } from '@/components/wohnen/MeineBewerbungenAlreadyToast'
import { MeineBewerbungenClient, type MeineBewerbungRow } from '@/components/wohnen/MeineBewerbungenClient'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseRentalListingPhotosJson } from '@/lib/rental/rental-listings-public'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Meine Bewerbungen | Helvenda Wohnungen',
  description: 'Übersicht deiner Wohnungsbewerbungen.',
}

function firstPhotoUrl(photosJson: string): string | null {
  const urls = parseRentalListingPhotosJson(photosJson)
  const u = urls[0]?.trim()
  if (!u) return null
  if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('//')) return u
  return null
}

export default async function MeineBewerbungenPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/meine-bewerbungen'))
  }

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  const profileComplete = Boolean(profile?.isComplete)

  const apps = await prisma.rentalApplication.findMany({
    where: { applicantUserId: userId },
    include: { listing: true },
    orderBy: { createdAt: 'desc' },
  })

  const rows: MeineBewerbungRow[] = apps.map(a => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    status: a.status,
    message: a.message,
    viewingRequestedAt: a.viewingRequestedAt?.toISOString() ?? null,
    viewingDate: a.viewingDate?.toISOString() ?? null,
    landlordRespondedAt: a.landlordRespondedAt?.toISOString() ?? null,
    rejectedAt: a.rejectedAt?.toISOString() ?? null,
    staleReportedAt: a.staleReportedAt?.toISOString() ?? null,
    listing: {
      id: a.listing.id,
      title: a.listing.title,
      address: a.listing.address,
      zip: a.listing.zip,
      city: a.listing.city,
      rooms: Number(a.listing.rooms),
      rentPerMonth: a.listing.rentPerMonth,
      firstPhotoUrl: firstPhotoUrl(a.listing.photos),
    },
  }))

  const activeCount = rows.filter(
    r => r.status === 'pending_credit_check' || r.status === 'pending_manual_review' || r.status === 'approved'
  ).length

  return (
    <main className="mx-auto max-w-3xl pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(3.25rem,calc(2rem+env(safe-area-inset-top,0px)))] sm:pl-6 sm:pr-6 sm:pt-14">
      <Suspense fallback={null}>
        <MeineBewerbungenAlreadyToast />
      </Suspense>
      <header className="pb-8">
        <h1 className="text-[1.5rem] font-extrabold leading-tight tracking-tight text-[#0d2b1f] sm:text-[1.875rem]">
          Meine Bewerbungen
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {activeCount === 0 ?
            'Keine laufenden Bewerbungen.'
          : activeCount === 1 ?
            '1 laufende Bewerbung — der Vermieter wurde mit deinem Profil informiert.'
          : `${activeCount} laufende Bewerbungen — Vermieter wurden mit deinem Profil informiert.`}
        </p>
      </header>
      <MeineBewerbungenClient applications={rows} profileComplete={profileComplete} />
    </main>
  )
}
