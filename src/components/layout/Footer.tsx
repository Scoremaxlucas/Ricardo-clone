'use client'

/**
 * Footer - Minimal Ricardo-Style Layout
 *
 * SIMPLIFIED:
 * - Removed duplicate navigation links (Kategorien, Auktionen, Favoriten, etc.)
 * - These are all accessible via the header navigation
 * - Only kept essential links: Help, Legal, Company info
 * - Much cleaner and less cluttered
 */

import { CookieSettingsButton } from '@/components/CookieConsent'
import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import Link from 'next/link'

export function Footer() {
  const { t } = useLanguage()

  // Mobile: horizontal scroll, Desktop: wrap
  const linkClass = "touch-target-exempt whitespace-nowrap text-sm text-white/90 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a4f4a] py-2 md:py-0"

  return (
    <footer
      className="relative mt-auto overflow-hidden text-white"
      style={{
        background: 'linear-gradient(180deg, #0d6560 0%, #0a4f4a 100%)',
        padding: '24px 0 20px',
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Content: Logo + Help Links */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          {/* Brand */}
          <div className="flex-shrink-0">
            <div className="mb-2 flex items-center">
              <Logo size="sm" className="text-white" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">
              {t.home.hero.subtitle}
            </p>
          </div>

          {/* Help Links - Horizontal scroll on mobile, wrap on desktop */}
          <nav
            className="-mx-4 flex items-center gap-x-5 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:flex-wrap md:gap-x-6 md:gap-y-2 md:overflow-visible md:px-0"
            aria-label="Hilfe-Links"
          >
            <a
              href={`${WOHNEN_SITE_ORIGIN}/`}
              className="touch-target-exempt whitespace-nowrap rounded-md border border-white/30 px-2.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a4f4a] md:py-1.5"
            >
              Mietwohnungen Schweiz
            </a>
            <Link href="/help" className={linkClass}>
              {t.footer.helpCenter}
            </Link>
            <Link href="/faq" className={linkClass}>
              {t.footer.faq}
            </Link>
            <Link href="/contact" className={linkClass}>
              {t.footer.contactUs}
            </Link>
            <Link href="/help/shipping-options" className={linkClass}>
              {t.product.shipping}
            </Link>
            <Link href="/help/safe-buying" className={linkClass}>
              {t.footer.safety}
            </Link>
            <Link href="/payment-protection" className={linkClass}>
              Zahlungsschutz
            </Link>
            <Link href="/fees" className={linkClass}>
              Gebühren
            </Link>
            <Link href="/help/system-outages" className={linkClass}>
              Systemausfälle
            </Link>
            {/* Spacer for scroll padding on mobile */}
            <span className="w-1 flex-shrink-0 md:hidden" aria-hidden="true" />
          </nav>
        </div>

        {/* Legal Strip */}
        <div className="mt-5 border-t border-white/20 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {/* Left: Copyright + Address */}
            <div className="text-xs text-white/70">
              <p>© {new Date().getFullYear()} Helvenda.ch · Score-Max GmbH, In der Hauswiese 2, 8125 Zollikerberg</p>
            </div>

            {/* Right: Legal Links */}
            <nav
              className="flex flex-wrap items-center gap-4 text-xs text-white/70"
              aria-label="Rechtliche Links"
            >
              <Link
                href="/privacy"
                className="transition-colors hover:text-white hover:underline"
              >
                {t.footer.privacyPolicy}
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-white hover:underline"
              >
                {t.footer.termsOfService}
              </Link>
              <Link
                href="/withdrawal-rights"
                className="transition-colors hover:text-white hover:underline"
              >
                Widerrufsbelehrung
              </Link>
              <Link
                href="/forbidden-items"
                className="transition-colors hover:text-white hover:underline"
              >
                Verbotsliste
              </Link>
              <Link
                href="/imprint"
                className="transition-colors hover:text-white hover:underline"
              >
                {t.footer.imprint}
              </Link>
              <CookieSettingsButton />
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom padding for chat widget */}
      <div className="h-2" aria-hidden="true" />
    </footer>
  )
}
