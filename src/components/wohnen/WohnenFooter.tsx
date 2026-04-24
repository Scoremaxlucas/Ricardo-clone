import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'

const footerBg = '#0d2b1f'

export function WohnenFooter() {
  return (
    <footer className="mt-auto text-white" style={{ backgroundColor: footerBg }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-8">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 shrink-0" aria-hidden>
                <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="#18a87c" />
                  <path
                    d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Helvenda Wohnungen</span>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-white/85">
              Helvenda Wohnungen ist der Schweizer Mietmarktplatz
              <br />
              der auf Qualität setzt — für Vermieter und Mietende gleichermassen.
            </p>
          </div>

          <div className="mb-6 md:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">Links</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              <li>
                <Link href="/wohnungen" className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline">
                  Wohnungen suchen
                </Link>
              </li>
              <li>
                <Link href="/matching/properties/new" className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline">
                  Wohnung inserieren
                </Link>
              </li>
              <li>
                <Link href="/profil" className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline">
                  Mein Profil
                </Link>
              </li>
              <li>
                <Link href="/profil/betreibungsregister" className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline">
                  Betreibungsregisterauszug hochladen
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-6 md:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">Info</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline"
                >
                  Über Helvenda
                </a>
              </li>
              <li>
                <Link href="/#wie-es-funktioniert" className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline">
                  So funktioniert&apos;s
                </Link>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline"
                >
                  Datenschutz
                </a>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline"
                >
                  Nutzungsbedingungen
                </a>
              </li>
              <li>
                <a
                  href={`${MAIN_SHOP_ORIGIN}/contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-white/90 hover:text-white hover:underline"
                >
                  Kontakt
                </a>
              </li>
            </ul>
          </div>

          <div className="mb-6 md:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">Vertrauen & Sicherheit</p>
            <ul className="mt-4 space-y-2 text-[13px] text-white/60">
              <li>🇨🇭 100% Schweizer Plattform</li>
              <li>🔒 Daten verschlüsselt gespeichert</li>
              <li>✓ Betreibungsregisterauszug verifiziert</li>
              <li>✓ Einkommensregel geprüft</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 md:mt-12">
          <p className="text-center text-[12px] text-white/70">
            © 2026 Helvenda Wohnungen · Score-Max GmbH · Zollikerberg
          </p>
        </div>
      </div>
    </footer>
  )
}
