import { SIC_BRAND_NAME, sicPaths } from '@/lib/sic/config'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: `${SIC_BRAND_NAME} — Das geprüfte Schweizer Mieterdossier`,
    template: `%s | ${SIC_BRAND_NAME}`,
  },
  description:
    'Erstellen Sie Ihr geprüftes Mieterzertifikat: Bonität, Einkommen, Zuverlässigkeit und Aufenthaltsstatus — verifiziert und mit QR-Code überprüfbar. Bewerben Sie sich schneller und überzeugender.',
  robots: { index: true, follow: true },
}

export default function SicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href={sicPaths.landing} className="flex items-center gap-2.5" aria-label={SIC_BRAND_NAME}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">
              SI
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Swiss<span className="text-teal-700">Immo</span>Cert
            </span>
          </Link>
          <Link
            href={sicPaths.dossier}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Mein Dossier
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SIC_BRAND_NAME}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={`${sicPaths.landing}/faq`} className="hover:text-slate-800">
              Häufige Fragen
            </Link>
            <Link href={`${sicPaths.landing}/datenschutz`} className="hover:text-slate-800">
              Datenschutz
            </Link>
            <Link href={`${sicPaths.landing}/agb`} className="hover:text-slate-800">
              AGB
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
