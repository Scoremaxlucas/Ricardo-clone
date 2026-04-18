import { MatchingSeekerMatchesClient, type SeekerMatchRow } from '@/components/matching/MatchingSeekerMatchesClient'
import { authOptions } from '@/lib/auth'
import { listSeekerMatchesForUser } from '@/lib/matching/matching-application-queries'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Treffer',
  description: 'Passende Mietobjekte für dein Suchprofil.',
}

export default async function MatchingSeekerMatchesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/matches'))
  }

  const raw = await listSeekerMatchesForUser(userId)
  const matches: SeekerMatchRow[] = raw.map(m => ({
    matchId: m.matchId,
    score: m.score,
    hardFailed: m.hardFailed,
    property: m.property,
    application: m.application
      ? { id: m.application.id, status: m.application.status }
      : null,
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Wohnungssuche</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Deine Treffer</h1>
      <p className="mt-2 text-sm text-slate-600">
        Aktive Treffer auf dein Suchprofil. Von hier aus kannst du eine strukturierte Bewerbung starten — mit
        gestuften Datenfreigaben für Vermieter:innen.
      </p>
      <div className="mt-8">
        <MatchingSeekerMatchesClient matches={matches} />
      </div>
      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/onboarding" className="text-teal-800 hover:underline">
          Suchprofil bearbeiten
        </Link>
        {' · '}
        <Link href="/matching/applications" className="text-teal-800 hover:underline">
          Meine Bewerbungen
        </Link>
      </p>
    </main>
  )
}
