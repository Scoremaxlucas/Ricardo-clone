import { authOptions } from '@/lib/auth'
import { loadMatchingPropertiesForLandlordUser } from '@/lib/matching/landlord-matching-properties'
import { MatchPropertyStatus } from '@prisma/client'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Meine Objekte',
  description: 'Helvenda Matching — erfasste Objekte verwalten.',
}

function statusLabel(s: MatchPropertyStatus): string {
  const map: Record<MatchPropertyStatus, string> = {
    [MatchPropertyStatus.draft]: 'Entwurf',
    [MatchPropertyStatus.active]: 'Aktiv',
    [MatchPropertyStatus.paused]: 'Pausiert',
    [MatchPropertyStatus.archived]: 'Archiviert',
  }
  return map[s]
}

function statusBadgeClass(s: MatchPropertyStatus): string {
  switch (s) {
    case MatchPropertyStatus.active:
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case MatchPropertyStatus.draft:
      return 'border-slate-200 bg-slate-50 text-slate-800'
    case MatchPropertyStatus.paused:
      return 'border-amber-200 bg-amber-50 text-amber-950'
    case MatchPropertyStatus.archived:
      return 'border-slate-300 bg-slate-100 text-slate-700'
    default:
      return 'border-slate-200 bg-white text-slate-800'
  }
}

export default async function MatchingPropertiesListPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/properties'))
  }

  const { properties } = await loadMatchingPropertiesForLandlordUser(userId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Matching · Vermieter</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Meine Objekte</h1>
          <p className="mt-2 text-sm text-slate-600">
            Alle erfassten Matching-Objekte — Status und Stammdaten im Wizard bearbeiten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/matching/properties/new"
            className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
          >
            Neues Objekt
          </Link>
          <Link
            href="/matching/properties/import"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Import
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <p className="text-sm text-slate-700">Noch keine Objekte erfasst.</p>
          <p className="mt-2 text-sm text-slate-600">
            Lege ein Objekt manuell an oder importiere eine CSV-/Excel-Liste.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/matching/properties/new" className="text-sm font-semibold text-teal-800 underline">
              Objekt erfassen →
            </Link>
            <Link href="/matching/properties/import" className="text-sm font-semibold text-teal-800 underline">
              Zum Import →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
          {properties.map(p => (
            <li key={p.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <Link
                  href={`/matching/properties/${p.id}/edit`}
                  className="font-semibold text-slate-900 hover:text-teal-800 hover:underline"
                >
                  {p.title}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {p.zip} {p.city} · {p.rooms} Zi. · CHF {p.rentPerMonth.toLocaleString('de-CH')} / Mt.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Zuletzt {p.updatedAt.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}
                >
                  {statusLabel(p.status)}
                </span>
                <Link
                  href={`/matching/properties/${p.id}/edit`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Bearbeiten
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-sm text-slate-500">
        <Link href="/matching" className="text-teal-800 underline-offset-2 hover:underline">
          Zurück zur Matching-Startseite
        </Link>
      </p>
    </main>
  )
}
