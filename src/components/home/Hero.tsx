'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function Hero() {
  const { t } = useLanguage()
  
  return (
    <section className="bg-primary-600 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Promo Box */}
          <div className="flex-1 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <h2 className="text-lg md:text-xl font-bold mb-1.5">
                {t.home.hero.sellNow}
              </h2>
              <p className="text-primary-100 text-xs mb-3">
                {t.home.hero.reachBuyers}
              </p>
              <Link
                href="/sell"
                className="inline-block bg-white text-primary-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-lg transition-all text-base shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.home.hero.offerItemNow}
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center justify-center py-5">
              <div className="text-center px-4">
                <h3 className="text-2xl md:text-3xl font-bold mb-1">
                  {t.home.hero.title}
                </h3>
                <p className="text-primary-100 text-sm">
                  {t.home.hero.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
