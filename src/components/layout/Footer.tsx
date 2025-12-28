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
            <p className="mb-6 text-base leading-relaxed text-white/90">{t.home.hero.subtitle}</p>
            <div className="flex items-center space-x-4">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/helvenda.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                aria-label="Facebook"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/helvenda_ch"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                aria-label="X (Twitter)"
              >
                <span className="sr-only">X (Twitter)</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/helvenda.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                aria-label="Instagram"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/helvenda"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                aria-label="LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
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
        </div>
      </div>
    </footer>
  )
}
