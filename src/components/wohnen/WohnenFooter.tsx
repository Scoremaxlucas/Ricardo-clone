import { Logo } from '@/components/ui/Logo'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'

const footerBg = '#0d2b1f'

export function WohnenFooter() {
  return (
    <footer className="mt-auto text-white" style={{ backgroundColor: footerBg }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-lg font-bold tracking-tight text-white">Helvenda Wohnungen</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/85">
              Die faire Wohnungsplattform der Schweiz — kostenlos inserieren, nur verifizierte Anfragen.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">Links</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/wohnungen" className="text-white/90 hover:text-white hover:underline">
                  Wohnungen suchen
                </Link>
              </li>
              <li>
                <Link href="/matching/properties/new" className="text-white/90 hover:text-white hover:underline">
                  Wohnung inserieren
                </Link>
              </li>
              <li>
                <Link href="/matching/properties/import" className="text-white/90 hover:text-white hover:underline">
                  Wohnung importieren
                </Link>
              </li>
              <li>
                <Link href="/profil" className="text-white/90 hover:text-white hover:underline">
                  Mein Profil
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">Info</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white hover:underline"
                >
                  Über Helvenda
                </a>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white hover:underline"
                >
                  Datenschutz
                </a>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white hover:underline"
                >
                  Nutzungsbedingungen
                </a>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white hover:underline"
                >
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-white/70 sm:text-left">
              © 2026 Helvenda Wohnungen · Score-Max GmbH · Zollikerberg
            </p>
            <a
              href={MAIN_SHOP_ORIGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-xs text-white/80 hover:text-white sm:text-right"
            >
              🛒 Zum Marktplatz → helvenda.ch
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
