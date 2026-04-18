import { Logo } from '@/components/ui/Logo'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Helvenda Matching',
    template: '%s — Helvenda Matching',
  },
  description:
    'Helvenda Matching: strukturierte Wohnungssuche, erklärbare Treffer und gestufte Freigaben — eigenständiges Produkt neben dem Marktplatz.',
}

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
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
