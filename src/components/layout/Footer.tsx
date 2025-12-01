'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer 
      className="text-white relative overflow-hidden mt-auto"
      style={{
        background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
        padding: '60px 0 40px'
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center mb-4">
              <Logo size="md" className="text-white" />
            </div>
            <p className="text-white/90 mb-6 leading-relaxed">
              {t.home.hero.subtitle}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Für Käufer */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD95C]">{t.footer.forBuyers}</h3>
            <ul className="space-y-3">
              <li><Link href="/categories" className="text-white/90 hover:text-white transition-colors">{t.header.categories}</Link></li>
              <li><Link href="/auctions" className="text-white/90 hover:text-white transition-colors">{t.header.auctions}</Link></li>
              <li><Link href="/favorites" className="text-white/90 hover:text-white transition-colors">{t.header.favorites}</Link></li>
              <li><Link href="/my-watches/buying" className="text-white/90 hover:text-white transition-colors">{t.header.myBuying}</Link></li>
            </ul>
          </div>

          {/* Für Verkäufer */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD95C]">{t.footer.forSellers}</h3>
            <ul className="space-y-3">
              <li><Link href="/sell" className="text-white/90 hover:text-white transition-colors">{t.header.sell}</Link></li>
              <li><Link href="/my-watches" className="text-white/90 hover:text-white transition-colors">{t.header.mySelling}</Link></li>
              <li><Link href="/my-watches/selling/fees" className="text-white/90 hover:text-white transition-colors">{t.header.feesAndInvoices}</Link></li>
            </ul>
          </div>

          {/* Hilfe & Support */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD95C]">{t.footer.help}</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-white/90 hover:text-white transition-colors">{t.footer.helpCenter}</Link></li>
              <li><Link href="/faq" className="text-white/90 hover:text-white transition-colors">{t.footer.faq}</Link></li>
              <li><Link href="/contact" className="text-white/90 hover:text-white transition-colors">{t.footer.contactUs}</Link></li>
              <li><Link href="/help/shipping-options" className="text-white/90 hover:text-white transition-colors">{t.product.shipping}</Link></li>
              <li><Link href="/help/safe-buying" className="text-white/90 hover:text-white transition-colors">{t.footer.safety}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/80 text-sm">
              © 2024 Helvenda.ch - {t.footer.allRightsReserved}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-white/80 hover:text-white text-sm transition-colors">{t.footer.privacyPolicy}</Link>
              <Link href="/terms" className="text-white/80 hover:text-white text-sm transition-colors">{t.footer.termsOfService}</Link>
              <Link href="/imprint" className="text-white/80 hover:text-white text-sm transition-colors">{t.footer.imprint}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
