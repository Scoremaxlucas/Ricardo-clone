'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function Hero() {
  const { t } = useLanguage()

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #10b981 100%)',
        padding: '80px 0',
      }}
    >
      {/* Subtiles Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Linke Box */}
          <div className="animate-fade-in-up max-w-md flex-1">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
                {t.home.hero.sellNow}
              </h2>
              <p className="mb-6 text-base leading-relaxed text-white/90">
                {t.home.hero.reachBuyers}
              </p>
              <Link
                href="/sell"
                className="hover:shadow-3xl inline-block rounded-[50px] bg-white px-8 py-4 text-lg font-bold text-primary-600 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-gray-50"
                style={{
                  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.2)',
                }}
              >
                {t.home.hero.offerItemNow}
              </Link>
            </div>
          </div>

          {/* Rechte Box - Gleiches Design wie links */}
          <div className="animate-fade-in-up max-w-2xl flex-1" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <h3 className="mb-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                {t.home.hero.title}
              </h3>
              <p className="text-base leading-relaxed text-white/90">{t.home.hero.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
