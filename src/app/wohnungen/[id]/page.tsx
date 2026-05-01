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
import { qualifyTenant } from '@/lib/rental/qualifyTenant'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
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
  const desc = `${zi}-Zimmer-Wohnung in ${listing.city} für ${formatCHF(listing.rentPerMonth)} pro Monat. Jetzt kostenlos bewerben auf Helvenda Wohnungen.`
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
  const tenantApplyReady = Boolean(
    tenantProfile && qualifyTenant(tenantProfile, listing).qualified
  )

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
  pills.push(`Verfügbar ab ${formatDate(listing.availableFrom)}`)

  return (
    <main className="pb-[5.5rem] lg:pb-16">
      <RentalListingDetailGallery imageUrls={photos} />

      <div className="mx-auto max-w-6xl py-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-6 sm:pr-6">
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

            <p className="text-[1.625rem] font-bold leading-tight text-[#18a87c] sm:text-3xl md:text-4xl">
              {formatCHF(listing.rentPerMonth)}{' '}
              <span className="text-lg font-semibold text-slate-600 sm:text-xl">/ Monat</span>
            </p>
            {listing.utilitiesPerMonth != null ? (
              <p className="mt-2 text-slate-600">NK: + {formatCHF(listing.utilitiesPerMonth)} / Monat</p>
            ) : null}
            {listing.depositAmount != null ? (
              <p className="mt-1 text-slate-600">Kaution: {formatCHF(listing.depositAmount)}</p>
            ) : null}

            <hr className="my-8 border-slate-200" />

            <h2 className="text-lg font-bold text-slate-900">Beschreibung</h2>
            <div className="mt-3">
              <ListingExpandableDescription text={listing.description} />
            </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24">
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
            <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] scroll-pl-1 scroll-pr-1 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:scroll-pl-0 lg:scroll-pr-0">
              {similar.map(row => (
                <div
                  key={row.id}
                  className="w-[min(320px,calc(100vw-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)-2rem))] shrink-0 lg:w-auto lg:min-w-0"
                >
                  <RentalListingCard listing={rentalListingRowToCardData(row)} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div
          className="pointer-events-auto border-t border-[#e8f7f2] bg-white py-3 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-6xl">
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
              compact
            />
          </div>
        </div>
      </div>
    </main>
  )
}
