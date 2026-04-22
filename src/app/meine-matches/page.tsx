import { MatchPreferencesInlineEditor } from '@/components/rental/MatchPreferencesInlineEditor'
import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchListings } from '@/lib/rental/matchListings'
import { INCOME_MINIMUMS } from '@/lib/rental/qualifyTenant'
import { rentalListingRowToCardData } from '@/lib/rental/rental-listings-public'
import { incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
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

function matchesEmptyState(reason: 'INCOME_BLOCKED' | 'CANTON_RESTRICTED' | 'CREDIT_CHECK_REQUIRED' | 'NO_MATCHES', info: {
  incomeLabel: string
  maxAffordableRent: number
  preferredCanton: string | null
}) {
  if (reason === 'INCOME_BLOCKED') {
    return (
      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">Noch keine Wohnungen in deiner Preisklasse</h2>
        <p className="mt-2">
          Basierend auf deinem Einkommensprofil ({info.incomeLabel}) suchen wir Wohnungen bis {formatCHF(info.maxAffordableRent)} / Monat.
          Aktuell sind keine passenden Inserate verfügbar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/wohnungen" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Alle Wohnungen ansehen →</Link>
          <Link href="/profil/bearbeiten" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Präferenzen anpassen →</Link>
        </div>
      </div>
    )
  }
  if (reason === 'CANTON_RESTRICTED') {
    return (
      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">Keine Matches im Kanton {info.preferredCanton || '—'}</h2>
        <p className="mt-2">
          Es gibt aktuell keine Wohnungen die zu deinen Präferenzen passen. Möchtest du den Kanton erweitern?
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/wohnungen" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Alle Kantone anzeigen</Link>
          <Link href="/profil/bearbeiten" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Präferenzen anpassen →</Link>
        </div>
      </div>
    )
  }
  if (reason === 'CREDIT_CHECK_REQUIRED') {
    return (
      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h2 className="text-lg font-bold">⚠️ Betreibungsregister erforderlich</h2>
        <p className="mt-2">
          Viele Vermieter verlangen einen Betreibungsregisterauszug. Lade deinen Auszug hoch um alle Matches zu sehen.
        </p>
        <div className="mt-4">
          <Link href="/profil/betreibungsregister" className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
            Jetzt hochladen →
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
      Aktuell keine passenden Matches gefunden.
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
  const incomeLabel = incomeCategoryLabelDe(profile.monthlyIncomeCategory)
  const maxAffordableRent = Math.floor((INCOME_MINIMUMS[profile.monthlyIncomeCategory] ?? 0) / 3)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Deine Matches</h1>
      <p className="mt-2 text-sm text-slate-600">
        {matches.length} Wohnungen passen zu deinem Profil
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {profile.preferredCanton ? (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">📍 Kanton {profile.preferredCanton}</span>
        ) : null}
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">💰 {incomeLabel} / Monat</span>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          {profile.creditCheckStatus === 'APPROVED' ? '✅ Betreibungsregister gültig' : '⚠️ Betreibungsregister fehlt/ungültig'}
        </span>
        <Link href="/profil/bearbeiten" className="ml-auto text-sm font-semibold text-teal-800 hover:underline">
          Profil anpassen →
        </Link>
      </div>

      <MatchPreferencesInlineEditor
        initial={{
          preferredCanton: profile.preferredCanton,
          preferredMinRooms: profile.preferredMinRooms,
          preferredBudgetMax: profile.preferredBudgetMax,
          preferredMoveInEarliest: profile.preferredMoveInEarliest?.toISOString() ?? null,
        }}
      />

      {emptyReason
        ? matchesEmptyState(emptyReason, {
            incomeLabel,
            maxAffordableRent,
            preferredCanton: profile.preferredCanton,
          })
        : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map(m => {
              const card = rentalListingRowToCardData({
                ...m.listing,
                __matchScore: m.score,
                __matchHighlights: m.highlights,
              })
              return <RentalListingCard key={m.listing.id} listing={card} showMatchBadge />
            })}
          </div>
        )}
    </main>
  )
}
