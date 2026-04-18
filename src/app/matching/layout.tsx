import { Logo } from '@/components/ui/Logo'
import { authOptions } from '@/lib/auth'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'

export const metadata: Metadata = {
  title: {
    default: 'Helvenda Matching',
    template: '%s — Helvenda Matching',
  },
  description:
    'Helvenda Matching: strukturierte Wohnungssuche, erklärbare Treffer und gestufte Freigaben — eigenständiges Produkt neben dem Marktplatz.',
}

export default async function MatchingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const isAdmin = session?.user?.isAdmin === true

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
            <Logo size="sm" />
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-teal-800 sm:inline">
              Matching
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
            <a
              href={MAIN_SHOP_ORIGIN}
              className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Marktplatz
            </a>
            <Link
              href="/matching/properties"
              className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Meine Objekte
            </Link>
            <Link
              href="/matching/properties/new"
              className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Neu
            </Link>
            <Link
              href="/matching/properties/import"
              className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Import
            </Link>
            {userId ? (
              <>
                <Link
                  href="/matching/onboarding"
                  className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Suchprofil
                </Link>
                <Link
                  href="/matching/matches"
                  className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Treffer
                </Link>
                <Link
                  href="/matching/applications"
                  className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Bewerbungen
                </Link>
                <Link
                  href="/matching/landlord/applications"
                  className="rounded-md px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Vermieter
                </Link>
              </>
            ) : null}
            {isAdmin ? (
              <Link
                href="/matching/ops"
                className="rounded-md px-2 py-1.5 font-medium text-amber-900 transition hover:bg-amber-50"
              >
                Ops
              </Link>
            ) : null}
            <Link
              href="/login"
              className="rounded-md bg-teal-700 px-3 py-1.5 font-medium text-white transition hover:bg-teal-800"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Helvenda Matching</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-end">
            <a href={MAIN_SHOP_ORIGIN} className="hover:text-teal-800 hover:underline">
              helvenda.ch (Marktplatz)
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
