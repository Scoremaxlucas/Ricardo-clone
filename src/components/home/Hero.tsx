'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function Hero() {
  const { t } = useLanguage()
  
  return (
    <section 
      className="text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #10b981 100%)',
        padding: '80px 0'
      }}
    >
      {/* Subtiles Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Linke Box */}
          <div className="flex-1 max-w-md animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                {t.home.hero.sellNow}
              </h2>
              <p className="text-white/90 text-base mb-6 leading-relaxed">
                {t.home.hero.reachBuyers}
              </p>
              <Link
                href="/sell"
                className="inline-block bg-white text-primary-600 hover:bg-gray-50 font-bold px-8 py-4 rounded-[50px] transition-all duration-300 text-lg shadow-2xl hover:shadow-3xl hover:scale-105 hover:-translate-y-1"
                style={{
                  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.2)'
                }}
              >
                {t.home.hero.offerItemNow}
              </Link>
            </div>
          </div>

          {/* Rechte Box - Gleiches Design wie links */}
          <div className="flex-1 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-3xl md:text-4xl font-bold mb-3 text-white leading-tight">
                {t.home.hero.title}
              </h3>
              <p className="text-white/90 text-base leading-relaxed">
                {t.home.hero.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
