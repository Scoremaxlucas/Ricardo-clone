import { authOptions } from '@/lib/auth'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'

export const metadata: Metadata = {
  title: 'Start',
  description:
    'Helvenda Matching: Profil, Kriterien und Freigaben — ein eigenes Produkt mit gemeinsamem Helvenda-Login, ohne Marktplatz-Oberfläche.',
}

export default async function MatchingLandingPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Helvenda Matching</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Passende Wohnung — strukturiert und kontrolliert
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Hier entsteht das Matching-Produkt: Profile, Regeln, nachvollziehbare Treffer und Freigaben, bevor sensible
        Daten geteilt werden. Das ist <strong className="font-semibold text-slate-800">nicht</strong> der
        klassische Marktplatz — gleiche technische Basis, anderes Geschäftsmodell.
      </p>

      <ul className="mt-8 space-y-3 text-slate-700">
        <li className="flex gap-2">
          <span className="font-semibold text-teal-800">·</span>
          <span>
            <strong className="font-medium text-slate-800">Ein Login</strong> mit deinem Helvenda-Konto — Session
            funktioniert über die Subdomain hinweg.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-teal-800">·</span>
          <span>
            <strong className="font-medium text-slate-800">Keine Marktplatz-Oberfläche</strong> — keine
            Kategorien, keine Inserat-Pfade für diese Subdomain.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-teal-800">·</span>
          <span>
            Funktionen werden hier schrittweise freigeschaltet (Profil, Objekte, Matching, Bewerbung) — siehe
            Produkt-Roadmap.
          </span>
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        {userId ? (
          <>
            <Link
              href="/matching/properties/new"
              className="inline-flex rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Objekt erfassen
            </Link>
            <Link
              href="/matching/properties/import"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              CSV / Excel import
            </Link>
            <Link
              href="/matching/onboarding"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Suchprofil einrichten
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Registrieren
            </Link>
          </>
        )}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        Artikel, Auktionen und klassischer Handel:{' '}
        <a href={MAIN_SHOP_ORIGIN} className="font-medium text-teal-800 underline-offset-2 hover:underline">
          helvenda.ch
        </a>
      </p>
    </main>
  )
}
