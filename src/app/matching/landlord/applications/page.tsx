import { authOptions } from '@/lib/auth'
import { listLandlordApplicationsForUser } from '@/lib/matching/matching-application-queries'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Bewerbungen (Vermieter)',
  description: 'Eingehende Matching-Bewerbungen.',
}

export default async function MatchingLandlordApplicationsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/landlord/applications'))
  }

  const apps = await listLandlordApplicationsForUser(userId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Vermieter</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Eingehende Bewerbungen</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ohne Freigaben der Suchenden siehst du nur Nachricht und Objektdaten. Details erscheinen gestuft nach
        Einverständnis.
      </p>
      <div className="mt-8 space-y-3">
        {apps.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Noch keine Bewerbungen.
          </p>
        ) : (
          apps.map(a => (
            <Link
              key={a.id}
              href={`/matching/landlord/applications/${a.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{a.property.title}</p>
                  <p className="text-sm text-slate-600">
                    {a.property.zip} {a.property.city}
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
        <Link href="/matching/properties/new" className="text-teal-800 hover:underline">
          Objekt erfassen
        </Link>
      </p>
    </main>
  )
}
