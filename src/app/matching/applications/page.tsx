import { authOptions } from '@/lib/auth'
import { listSeekerApplicationsForUser } from '@/lib/matching/matching-application-queries'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Meine Bewerbungen',
  description: 'Matching-Bewerbungen verwalten.',
}

export default async function MatchingSeekerApplicationsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/applications'))
  }

  const apps = await listSeekerApplicationsForUser(userId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Wohnungssuche</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Meine Bewerbungen</h1>
      <div className="mt-8 space-y-3">
        {apps.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Noch keine Bewerbungen. Siehe{' '}
            <Link href="/matching/matches" className="font-medium text-teal-800 underline-offset-2 hover:underline">
              Treffer
            </Link>
            .
          </p>
        ) : (
          apps.map(a => (
            <Link
              key={a.id}
              href={`/matching/applications/${a.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{a.property.title}</p>
                  <p className="text-sm text-slate-600">
                    {a.property.zip} {a.property.city} · {a.property.canton} · CHF {a.property.rentPerMonth}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {a.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Aktualisiert: {a.updatedAt.toLocaleString('de-CH')}
              </p>
            </Link>
          ))
        )}
      </div>
      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/matches" className="text-teal-800 hover:underline">
          Treffer
        </Link>
      </p>
    </main>
  )
}
