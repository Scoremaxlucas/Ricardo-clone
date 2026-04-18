import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { ListingExpandableDescription } from '@/components/rental/ListingExpandableDescription'
import { RentalListingDetailGallery } from '@/components/rental/RentalListingDetailGallery'
import { WohnungBewerbungsBox } from '@/components/rental/WohnungBewerbungsBox'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  fetchActiveRentalListingById,
  fetchSimilarRentalListings,
  parseRentalListingPhotosJson,
  rentalListingRowToCardData,
} from '@/lib/rental/rental-listings-public'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { Calendar, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

function absOgImage(url: string) {
  const u = url.trim()
  if (u.startsWith('https://') || u.startsWith('http://')) return u
  if (u.startsWith('//')) return `https:${u}`
  if (u.startsWith('/')) return `${WOHNEN_SITE_ORIGIN}${u}`
  return `${WOHNEN_SITE_ORIGIN}/${u}`
}

function cantonLabel(code: string) {
  const c = SWISS_CANTONS.find(x => x.code === code.toUpperCase())
  return c ? `${c.code} (${c.name})` : code
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchActiveRentalListingById(id)
  if (!listing) {
    return { title: 'Inserat | Helvenda Wohnungen' }
  }
  const rooms = Number(listing.rooms)
  const zi = Number.isFinite(rooms) ? String(rooms).replace('.', ',') : String(listing.rooms)
  const title = `${listing.title} — ${zi} Zi, ${listing.city} | Helvenda Wohnungen`
  const desc = `${zi}-Zimmer-Wohnung in ${listing.city} für CHF ${listing.rentPerMonth.toLocaleString('de-CH')}/Monat. Jetzt auf Helvenda Wohnungen bewerben — kostenlos und ohne Abo.`
  const photos = parseRentalListingPhotosJson(listing.photos)
  const og = photos[0] ? absOgImage(photos[0]) : undefined
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      ...(og ? { images: [{ url: og }] } : {}),
    },
  }
}

export default async function WohnungDetailPage({ params }: PageProps) {
  const { id } = await params
  const listing = await fetchActiveRentalListingById(id)
  if (!listing) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null

  const tenantProfile = userId
    ? await prisma.tenantProfile.findUnique({ where: { userId } })
    : null
  const profileComplete = Boolean(tenantProfile?.isComplete)
  const creditCheckOk = Boolean(
    tenantProfile?.creditCheckStatus === 'APPROVED' &&
      tenantProfile.creditCheckExpiresAt &&
      tenantProfile.creditCheckExpiresAt.getTime() > Date.now()
  )
  const tenantApplyReady =
    profileComplete && (!listing.requiresCreditCheck || creditCheckOk)

  const existingApplication = userId
    ? await prisma.rentalApplication.findFirst({
        where: {
          rentalListingId: listing.id,
          applicantUserId: userId,
          status: { in: ['pending_credit_check', 'pending_manual_review', 'approved'] },
        },
      })
    : null
  const alreadyApplied = Boolean(existingApplication)

  const isOwner = Boolean(userId && userId === listing.userId)
  const photos = parseRentalListingPhotosJson(listing.photos)
  const similar = await fetchSimilarRentalListings(listing.canton, listing.id, 3)

  const pills: string[] = [`${Number(listing.rooms)} Zimmer`, `${listing.areaSqm} m²`]
  if (listing.floor != null) pills.push(`Etage ${listing.floor}`)
  pills.push(`Verfügbar ab ${listing.availableFrom.toLocaleDateString('de-CH')}`)

  return (
    <main className="pb-16">
      <RentalListingDetailGallery imageUrls={photos} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link href="/wohnungen" className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline">
          ← Alle Wohnungen
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,36%)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">{listing.title}</h1>
            <p className="mt-3 flex flex-wrap items-start gap-2 text-sm text-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span>
                {listing.address}, {listing.zip} {listing.city}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                >
                  {p.includes('Verfügbar') ? (
                    <>
                      <Calendar className="mr-1 h-3.5 w-3.5 text-slate-500" aria-hidden />
                      {p}
                    </>
                  ) : (
                    p
                  )}
                </span>
              ))}
            </div>

            <hr className="my-8 border-slate-200" />

            <p className="text-3xl font-bold text-[#18a87c] sm:text-4xl">
              CHF {listing.rentPerMonth.toLocaleString('de-CH')}.—{' '}
              <span className="text-lg font-semibold text-slate-600 sm:text-xl">/ Monat</span>
            </p>
            {listing.utilitiesPerMonth != null ? (
              <p className="mt-2 text-slate-600">
                NK: + CHF {listing.utilitiesPerMonth.toLocaleString('de-CH')}.— / Monat
              </p>
            ) : null}
            {listing.depositAmount != null ? (
              <p className="mt-1 text-slate-600">Kaution: CHF {listing.depositAmount.toLocaleString('de-CH')}.—</p>
            ) : null}

            <hr className="my-8 border-slate-200" />

            <h2 className="text-lg font-bold text-slate-900">Beschreibung</h2>
            <div className="mt-3">
              <ListingExpandableDescription text={listing.description} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <WohnungBewerbungsBox
              listingId={listing.id}
              rentPerMonth={listing.rentPerMonth}
              requiresCreditCheck={listing.requiresCreditCheck}
              userId={userId}
              profileComplete={profileComplete}
              creditCheckOk={creditCheckOk}
              tenantApplyReady={tenantApplyReady}
              alreadyApplied={alreadyApplied}
              isOwner={isOwner}
            />
          </aside>
        </div>

        {similar.length > 0 ? (
          <section className="mt-16 border-t border-slate-200 pt-12">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Weitere Wohnungen in {cantonLabel(listing.canton)}
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map(row => (
                <RentalListingCard key={row.id} listing={rentalListingRowToCardData(row)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
