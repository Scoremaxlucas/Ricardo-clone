'use client'

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
        padding: '60px 0 40px',
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Mobile: Accordion Sections, Desktop: Grid */}
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 lg:grid-cols-5">
          {/* Company Info - Always visible */}
          <div className="col-span-1 lg:col-span-2">
            <div className="mb-4 flex items-center">
              <Logo size="md" className="text-white" />
            </div>
            <p className="text-base leading-relaxed text-white/90">{t.home.hero.subtitle}</p>
          </div>

          {/* Für Käufer - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('buyers')}
              className="mb-4 flex w-full items-center justify-between text-left text-lg font-semibold text-accent-500 md:mb-4 md:block md:w-auto"
              aria-expanded={openSections.has('buyers') || undefined}
            >
              <span>{t.footer.forBuyers}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('buyers') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-left transition-all md:block ${
                openSections.has('buyers') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.categories}
                </Link>
              </li>
              <li>
                <Link
                  href="/auctions"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.auctions}
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.favorites}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches/buying"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.myBuying}
                </Link>
              </li>
            </ul>
          </div>

          {/* Für Verkäufer - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('sellers')}
              className="mb-4 flex w-full items-center justify-between text-left text-lg font-semibold text-accent-500 md:mb-4 md:block md:w-auto"
              aria-expanded={openSections.has('sellers') || undefined}
            >
              <span>{t.footer.forSellers}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('sellers') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-left transition-all md:block ${
                openSections.has('sellers') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/sell"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.sell}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.mySelling}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-watches/selling/fees"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.header.feesAndInvoices}
                </Link>
              </li>
            </ul>
          </div>

          {/* Hilfe & Support - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('help')}
              className="mb-4 flex w-full items-center justify-between text-left text-lg font-semibold text-accent-500 md:mb-4 md:block md:w-auto"
              aria-expanded={openSections.has('help') || undefined}
            >
              <span>{t.footer.help}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 transition-transform md:hidden ${
                  openSections.has('help') ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-left transition-all md:block ${
                openSections.has('help') ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link
                  href="/help"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.footer.faq}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  href="/help/shipping-options"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.product.shipping}
                </Link>
              </li>
              <li>
                <Link
                  href="/help/safe-buying"
                  className="text-sm text-white/90 transition-colors hover:text-white hover:underline"
                >
                  {t.footer.safety}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links - Always visible, 2-column grid on mobile */}
        <div className="mt-10 border-t border-white/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-white/70">
              © {new Date().getFullYear()} Helvenda.ch - {t.footer.allRightsReserved}
            </p>
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center md:justify-center md:gap-6">
              <Link
                href="/privacy"
                className="text-sm text-white/70 transition-colors hover:text-white hover:underline"
              >
                {t.footer.privacyPolicy}
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/70 transition-colors hover:text-white hover:underline"
              >
                {t.footer.termsOfService}
              </Link>
              <Link
                href="/imprint"
                className="text-sm text-white/70 transition-colors hover:text-white hover:underline"
              >
                {t.footer.imprint}
              </Link>
            </div>
          </div>
          {/* Score-Max GmbH Information */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70">
              Inhaber und Betreiber von helvenda.ch ist die Firma Score-Max GmbH, in der Hauswiese
              2, 8125 Zollikerberg
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
