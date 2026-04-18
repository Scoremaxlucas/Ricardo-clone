import { WohnenPublicNav } from '@/components/wohnen/WohnenPublicNav'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: 'Helvenda Wohnungen',
    template: '%s — Helvenda Wohnungen',
  },
  description:
    'Helvenda Wohnungen: fair mieten und vermieten — strukturierte Objekte, verifizierte Bewerbungen und ein gemeinsames Helvenda-Konto.',
}

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <WohnenPublicNav />
      {children}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8">
          <p>© {new Date().getFullYear()} Helvenda Wohnungen</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-end">
            <a href={MAIN_SHOP_ORIGIN} className="hover:text-teal-800 hover:underline">
              helvenda.ch (Marktplatz)
            </a>
            <Link href="/wohnungen" className="hover:text-teal-800 hover:underline">
              Wohnungen suchen
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
