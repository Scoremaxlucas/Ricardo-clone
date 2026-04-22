import { MatchPreferencesInlineEditor } from '@/components/rental/MatchPreferencesInlineEditor'
import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchListings } from '@/lib/rental/matchListings'
import { rentalListingRowToCardData } from '@/lib/rental/rental-listings-public'
import { formatCHF } from '@/lib/utils/formatCurrency'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Meine Matches | Helvenda Wohnungen',
  description: 'Deine persönlich passenden Mietwohnungen.',
}

function dayGreeting(now: Date): string {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'Morgen'
  if (h >= 11 && h < 18) return 'Tag'
  return 'Abend'
}

function IconPin() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M10 1.7a5.3 5.3 0 0 0-5.3 5.3c0 3.8 4.1 8.9 5 10a.4.4 0 0 0 .6 0c.9-1.1 5-6.2 5-10A5.3 5.3 0 0 0 10 1.7Zm0 7.5A2.2 2.2 0 1 1 10 4.8a2.2 2.2 0 0 1 0 4.4Z" />
    </svg>
  )
}

function IconBed() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M3 5.5a1 1 0 0 1 2 0v2h10V6a1.5 1.5 0 1 1 3 0v6.5a1 1 0 1 1-2 0V11H4v1.5a1 1 0 1 1-2 0v-7Z" />
    </svg>
  )
}

function IconChf() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M13.9 3.3a6.4 6.4 0 1 0 0 13.4 6.2 6.2 0 0 0 3.8-1.2l-1-1.5a4.3 4.3 0 0 1-2.7.9A4.5 4.5 0 0 1 9.5 10a4.5 4.5 0 0 1 4.4-4.9c1 0 2 .3 2.7.9l1-1.5a6.2 6.2 0 0 0-3.7-1.2ZM2 8.8h6.5v1.8H2V8.8Z" />
    </svg>
  )
}

function IconShieldCheck({ colorClass }: { colorClass: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${colorClass}`}>
      <path fill="currentColor" d="M10 1.8 3.4 4.2v5.3c0 4 2.6 7 6.3 8.8a.8.8 0 0 0 .6 0c3.7-1.8 6.3-4.8 6.3-8.8V4.2L10 1.8Zm3 6.3-3.4 3.4a.8.8 0 0 1-1.1 0L7 10.1l1.1-1.1 1 1 2.8-2.8L13 8.1Z" />
    </svg>
  )
}

function EmptyStateCard() {
  return (
    <div className="mx-auto mt-8 max-w-[500px] rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
          <path fill="currentColor" d="m21.7 20.3-5-5a7 7 0 1 0-1.4 1.4l5 5a1 1 0 0 0 1.4-1.4ZM5 10a5 5 0 1 1 10 0A5 5 0 0 1 5 10Z" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Noch keine Matches</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Wir haben noch keine Wohnungen die genau zu deinen Präferenzen passen. Sobald etwas Passendes inseriert wird, melden wir uns.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/profil/bearbeiten" className="rounded-lg border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
          Präferenzen anpassen
        </Link>
        <Link href="/wohnungen" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Alle Wohnungen ansehen
        </Link>
      </div>
    </div>
  )
}

export default async function MeineMatchesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) redirect('/login?callbackUrl=/meine-matches')

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile) redirect('/profil/erstellen?next=/meine-matches')
  if (!profile.isComplete) redirect('/profil/erstellen?next=/meine-matches')

  const listings = await prisma.rentalListing.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  })

  const { matches, emptyReason } = matchListings(profile, listings)
  const now = new Date()
  const greeting = dayGreeting(now)

  return (
    <main className="min-h-screen bg-[#f8fdfb]">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12">
        <section className="pb-8">
          <h1 className="text-[32px] font-extrabold text-[#0d2b1f]">Guten {greeting}, {profile.firstName}.</h1>
          {matches.length > 0 ? (
            <p className="mt-3 text-[17px] text-slate-700">
              Wir haben <span className="font-extrabold text-teal-700">{matches.length}</span> Wohnungen gefunden die zu dir passen.
            </p>
          ) : (
            <p className="mt-3 text-[17px] text-slate-500">
              Noch keine Wohnungen die genau zu dir passen — wir suchen täglich weiter.
            </p>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {profile.preferredCanton ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                <IconPin /> Kanton {profile.preferredCanton}
              </span>
            ) : null}
            {profile.preferredMinRooms != null ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                <IconBed /> ab {profile.preferredMinRooms} Zi.
              </span>
            ) : null}
            {profile.preferredBudgetMax != null ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                <IconChf /> bis {formatCHF(profile.preferredBudgetMax)}/Mo
              </span>
            ) : null}
            {profile.creditCheckStatus === 'APPROVED' ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                <IconShieldCheck colorClass="text-emerald-600" /> Verifiziert
              </span>
            ) : (
              <Link
                href="/profil/betreibungsregister"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-orange-100 px-3 py-[5px] text-xs font-semibold text-orange-800 ring-1 ring-orange-200 hover:bg-orange-200"
              >
                <IconShieldCheck colorClass="text-orange-600" /> Betreibungsregister hochladen
              </Link>
            )}
          </div>

          <MatchPreferencesInlineEditor
            initial={{
              preferredCanton: profile.preferredCanton,
              preferredMinRooms: profile.preferredMinRooms,
              preferredBudgetMax: profile.preferredBudgetMax,
              preferredMoveInEarliest: profile.preferredMoveInEarliest?.toISOString() ?? null,
            }}
          />
        </section>

        <section className="mt-6">
          {emptyReason || matches.length === 0 ? (
            <EmptyStateCard />
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.map(m => {
                const card = rentalListingRowToCardData({
                  ...m.listing,
                  __matchScore: m.score,
                  __matchHighlights: m.highlights,
                })
                return <RentalListingCard key={m.listing.id} listing={card} matchScore={m.score} />
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
