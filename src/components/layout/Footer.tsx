'use client'

/**
 * Footer - Compact Two-Tier Layout (Ricardo-Style)
 *
 * REFACTOR SUMMARY:
 * - Reduced vertical padding by ~50% (from 60px/40px to 32px/24px)
 * - Restructured into two tiers: Navigation (Tier A) + Legal (Tier B)
 * - Reduced heading prominence (less saturated, smaller size)
 * - Compact legal strip with all info in single bar
 * - Matched max-width with main content (max-w-7xl)
 * - All content preserved: no links, text, or sections removed
 * - Improved space efficiency while maintaining accessibility
 */

import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Footer() {
  const { t } = useLanguage()
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <footer
      className="relative mt-auto overflow-hidden text-white"
      style={{
        background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
        padding: '32px 0 24px',
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* TIER A: Navigation - Logo + 3 Link Columns */}
        <div className="space-y-4 md:grid md:grid-cols-4 md:gap-6 md:space-y-0 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="mb-3 flex items-center">
              <Logo size="sm" className="text-white" />
            </div>
            <p className="text-sm leading-relaxed text-white/80">{t.home.hero.subtitle}</p>
          </div>

          {/* Für Käufer */}
          <div>
            <button
              onClick={() => toggleSection('buyers')}
              className="mb-2.5 flex w-full items-center justify-between text-left text-sm font-semibold text-white/90 md:mb-2.5 md:block md:w-auto"
              aria-expanded={openSections.has('buyers') || undefined}
            >
              <span>{t.footer.forBuyers}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('buyers') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-1.5 text-left transition-all md:block ${
                openSections.has('buyers') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.categories}
                </Link>
              </li>
              <li>
                <Link
                  href="/auctions"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.auctions}
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.favorites}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches/buying"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.myBuying}
                </Link>
              </li>
            </ul>
          </div>

          {/* Für Verkäufer */}
          <div>
            <button
              onClick={() => toggleSection('sellers')}
              className="mb-2.5 flex w-full items-center justify-between text-left text-sm font-semibold text-white/90 md:mb-2.5 md:block md:w-auto"
              aria-expanded={openSections.has('sellers') || undefined}
            >
              <span>{t.footer.forSellers}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('sellers') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-1.5 text-left transition-all md:block ${
                openSections.has('sellers') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/sell"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.sell}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.mySelling}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches/selling/fees"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.header.feesAndInvoices}
                </Link>
              </li>
            </ul>
          </div>

          {/* Hilfe & Support */}
          <div>
            <button
              onClick={() => toggleSection('help')}
              className="mb-2.5 flex w-full items-center justify-between text-left text-sm font-semibold text-white/90 md:mb-2.5 md:block md:w-auto"
              aria-expanded={openSections.has('help') || undefined}
            >
              <span>{t.footer.help}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('help') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-1.5 text-left transition-all md:block ${
                openSections.has('help') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/help"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.footer.faq}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  href="/help/shipping-options"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.product.shipping}
                </Link>
              </li>
              <li>
                <Link
                  href="/help/safe-buying"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.footer.safety}
                </Link>
              </li>
              <li>
                <Link
                  href="/help/system-outages"
                  className="text-sm text-white/80 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
                >
                  {t.helpArticles?.['system-outages']?.title || 'Grundsätze bei Systemausfällen'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* TIER B: Legal Strip - Compact single bar */}
        <div className="mt-6 border-t border-white/20 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {/* Left: Copyright + Address */}
            <div className="flex flex-col gap-1.5 text-sm text-white/70 md:gap-1">
              <p>© {new Date().getFullYear()} Helvenda.ch - {t.footer.allRightsReserved}</p>
              <address className="not-italic">
                Inhaber und Betreiber von helvenda.ch ist die Firma Score-Max GmbH, in der Hauswiese
                2, 8125 Zollikerberg
              </address>
            </div>

            {/* Right: Legal Links */}
            <nav
              className="flex flex-wrap items-center gap-4 text-sm text-white/70 md:flex-nowrap"
              aria-label="Rechtliche Links"
            >
              <Link
                href="/privacy"
                className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
              >
                {t.footer.privacyPolicy}
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
              >
                {t.footer.termsOfService}
              </Link>
              <Link
                href="/imprint"
                className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f766e]"
              >
                {t.footer.imprint}
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom padding for chat widget - ensures legal links aren't covered */}
      <div className="h-4" aria-hidden="true" />
    </footer>
  )
}
