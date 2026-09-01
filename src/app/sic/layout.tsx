import { SicHeaderCta } from '@/components/sic/SicHeaderCta'
import { SicLogo } from '@/components/sic/SicLogo'
import { SIC_BASE_PATH, SIC_BRAND_NAME, sicPaths } from '@/lib/sic/config'
import { getSicLandingAccount } from '@/lib/sic/landing-account'
import { SIC_MODULES } from '@/lib/sic/modules'
import type { Metadata } from 'next'
import { Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const sicSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sic-serif',
  weight: ['400', '600', '700'],
})

// Titel/Marke werden im Root-Layout (host-abhängig) gesetzt; hier NICHT erneut
// definieren, sonst wird die Marke im <title> doppelt angehängt.
export const metadata: Metadata = {
  description:
    'Wohnungssuche Schweiz: Bewerbungen bleiben oft ungelesen. Swiss Immo Cert ist das geprüfte Mieter-Zertifikat — eine Seite, per QR prüfbar. Damit der Vermieter dich sieht. Kein Abo.',
  robots: { index: true, follow: true },
}

export default async function SicLayout({ children }: { children: React.ReactNode }) {
  const account = await getSicLandingAccount()
  const hasCertificate = Boolean(account)
  const canAddModules = Boolean(account && account.ownedModules.length < SIC_MODULES.length)

  return (
    <div className={`${sicSerif.variable} flex min-h-screen flex-col bg-sic-paper text-slate-900`}>
      <header className="sticky top-0 z-40 border-b border-sic-hairline/80 bg-sic-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={sicPaths.landing} aria-label={SIC_BRAND_NAME}>
            <SicLogo size={32} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <SicHeaderCta hasCertificate={hasCertificate} canAddModules={canAddModules} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="mt-auto bg-sic-navy-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SicLogo size={30} onDark />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              Das geprüfte Schweizer Mieter-Zertifikat. Damit deine Bewerbung gelesen wird. Keine
              Wohnungszusage — ein Blatt, das der Vermieter nicht überblättert.
            </p>
          </div>
          <nav className="flex flex-col gap-2.5 text-sm">
            <Link
              href={sicPaths.faq}
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
