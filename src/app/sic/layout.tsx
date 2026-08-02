import { SicLogo } from '@/components/sic/SicLogo'
import { SIC_BASE_PATH, SIC_BRAND_NAME, sicPaths } from '@/lib/sic/config'
import type { Metadata } from 'next'
import Link from 'next/link'

// Titel/Marke werden im Root-Layout (host-abhängig) gesetzt; hier NICHT erneut
// definieren, sonst wird die Marke im <title> doppelt angehängt.
export const metadata: Metadata = {
  description:
    'Erstelle dein geprüftes Mieter-Zertifikat: Bonität, Einkommen, Zuverlässigkeit und Aufenthaltsstatus — geprüft und per QR-Code überprüfbar. Bewirb dich schneller und überzeugender.',
  robots: { index: true, follow: true },
}

export default function SicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={sicPaths.landing} aria-label={SIC_BRAND_NAME}>
            <SicLogo size={32} />
          </Link>
          <Link
            href={sicPaths.dossier}
            className="rounded-lg border border-[#0f2b5e]/15 px-3.5 py-2 text-sm font-semibold text-[#0f2b5e] transition-colors hover:bg-[#0f2b5e]/5"
          >
            Mein Dossier
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="mt-auto bg-[#0a1f45] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SicLogo size={30} onDark />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              Das geprüfte Schweizer Mieter-Zertifikat. Bonität, Einkommen, Zuverlässigkeit und
              Aufenthaltsstatus — verifiziert und mit QR-Code überprüfbar.
            </p>
          </div>
          <nav className="flex flex-col gap-2.5 text-sm">
            <Link
              href={`${SIC_BASE_PATH}/faq`}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Häufige Fragen
            </Link>
            <Link
              href={`${SIC_BASE_PATH}/datenschutz`}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Datenschutz
            </Link>
            <Link
              href={`${SIC_BASE_PATH}/agb`}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              AGB
            </Link>
            <Link
              href={`${SIC_BASE_PATH}/impressum`}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Impressum
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-white/40">
            © {new Date().getFullYear()} {SIC_BRAND_NAME}
          </div>
        </div>
      </footer>
    </div>
  )
}
