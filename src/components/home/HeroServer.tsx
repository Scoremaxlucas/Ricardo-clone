/**
 * HeroServer - Pure Server Component für LCP-Optimierung
 * 
 * Der statische Hero-Content wird server-side gerendert für:
 * - Schnelleres LCP (Largest Contentful Paint)
 * - Besseres SEO (Text ist sofort im HTML)
 * - Reduziertes JavaScript Bundle
 * 
 * Client-Components (Search, CategoryLinks) werden separat geladen.
 */

import Link from 'next/link'

interface HeroServerProps {
  title?: string
  subtitle?: string
  sellNowText?: string
  sellNowDescription?: string
  sellNowButton?: string
  children?: React.ReactNode // Für Search Component
}

export function HeroServer({
  title = 'Finden Sie genau das, was Sie suchen',
  subtitle = 'Schweizer Online-Marktplatz für alle Ihre Bedürfnisse',
  sellNowText = 'Verkaufen Sie jetzt',
  sellNowDescription = 'Erreichen Sie tausende potenzielle Käufer in der Schweiz',
  sellNowButton = 'Jetzt Artikel anbieten',
  children,
}: HeroServerProps) {
  return (
    <section
      className="relative overflow-hidden py-10 text-white md:py-16"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #10b981 100%)',
      }}
    >
      {/* Subtiles Pattern Overlay - Inline für LCP */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Layout: 2 Spalten - Suchleiste links, Verkaufen Box rechts */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Linke Spalte: Suchleiste (60% auf Desktop) */}
          <div className="lg:col-span-2">
            <div className="mx-auto max-w-3xl">
              {/* LCP-OPTIMIERT: H1 ist sofort im HTML, kein JavaScript nötig */}
              <h1 className="mb-4 text-center text-3xl font-bold text-white md:mb-5 md:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mb-8 text-center text-base text-white/90 md:mb-10 md:text-lg">
                {subtitle}
              </p>
              {/* Slot für Client Component (Search) */}
              <div className="mx-auto max-w-3xl">
                {children}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Verkaufen Sie jetzt Box (40% auf Desktop) */}
          <div className="lg:col-span-1">
            <div className="mx-auto max-w-md lg:max-w-full">
              <div className="rounded-2xl border border-white/20 bg-white/8 p-6 shadow-lg backdrop-blur-md">
                <h2 className="mb-3 text-xl font-bold text-white md:text-2xl">
                  {sellNowText}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-white/90 md:text-base">
                  {sellNowDescription}
                </p>
                <Link
                  href="/sell"
                  className="inline-block w-full rounded-[50px] bg-[#f97316] px-6 py-3 text-center text-base font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] md:px-8 md:py-4 md:text-lg"
                  style={{
                    boxShadow: '0px 4px 16px rgba(249, 115, 22, 0.25)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0px 6px 24px rgba(249, 115, 22, 0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0px 4px 16px rgba(249, 115, 22, 0.25)'
                  }}
                >
                  {sellNowButton}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
