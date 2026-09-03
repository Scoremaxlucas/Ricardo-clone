import { SicHeaderCta } from '@/components/sic/SicHeaderCta'
import { SicLogo } from '@/components/sic/SicLogo'
import { authOptions } from '@/lib/auth'
import { SIC_META_DESCRIPTION, SIC_TAGLINE } from '@/lib/sic/brand'
import { isSicAdminEmail } from '@/lib/sic/admin-access'
import { SIC_BASE_PATH, SIC_BRAND_NAME, sicPaths } from '@/lib/sic/config'
import { getSicLandingAccount } from '@/lib/sic/landing-account'
import { SIC_MODULES } from '@/lib/sic/modules'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
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
  description: SIC_META_DESCRIPTION,
  robots: { index: true, follow: true },
}

export default async function SicLayout({ children }: { children: React.ReactNode }) {
  const [account, session] = await Promise.all([getSicLandingAccount(), getServerSession(authOptions)])
  const hasCertificate = Boolean(account)
  const canAddModules = Boolean(account && account.ownedModules.length < SIC_MODULES.length)
  // Nur Allowlist — Kunden sehen diesen Link nie.
  const showReviewEntry = isSicAdminEmail(session?.user?.email)

  return (
    <div className={`${sicSerif.variable} flex min-h-[100dvh] flex-col overflow-x-clip bg-sic-paper text-slate-900`}>
      <header className="sticky top-0 z-40 border-b border-sic-hairline/80 bg-sic-paper/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:h-16 sm:gap-3 sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <Link href={sicPaths.landing} aria-label={SIC_BRAND_NAME} className="min-w-0 shrink touch-target-exempt">
            <SicLogo size={28} className="sm:hidden" />
            <SicLogo size={32} className="hidden sm:inline-flex" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {showReviewEntry ?
              <Link
                href={sicPaths.admin}
                className="hidden text-xs font-medium text-slate-400 transition-colors hover:text-sic-navy sm:inline"
              >
                Prüfung
              </Link>
            : null}
            <SicHeaderCta hasCertificate={hasCertificate} canAddModules={canAddModules} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
        {children}
      </main>

      <footer className="mt-auto bg-sic-navy-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SicLogo size={30} onDark />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              {SIC_TAGLINE}. Geprüfte Angaben für die Auswahl. Keine Wohnungszusage.
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
              href={sicPaths.datenschutz}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Datenschutz
            </Link>
            <Link
              href={sicPaths.agb}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              AGB
            </Link>
            <Link
              href={sicPaths.impressum}
              className="text-white/80 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Impressum
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-xs text-white/40">
            © {new Date().getFullYear()} {SIC_BRAND_NAME}
          </div>
        </div>
      </footer>
    </div>
  )
}
