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
  if (!profile?.isComplete) {
    redirect('/profil/erstellen?next=' + encodeURIComponent('/meine-bewerbungen'))
  }

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
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Suspense fallback={null}>
        <MeineBewerbungenAlreadyToast />
      </Suspense>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Meine Bewerbungen</h1>
      <p className="mt-2 text-sm text-slate-600">
        {activeCount} laufende Bewerbung{activeCount === 1 ? '' : 'en'}
      </p>
      <div className="mt-8">
        <MeineBewerbungenClient applications={rows} />
      </div>
    </main>
  )
}
