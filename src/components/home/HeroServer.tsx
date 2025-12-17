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

import { TrustMiniBullets } from './TrustMiniBullets'

interface HeroServerProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode // Für Search Component
}

export function HeroServer({
  title = 'Finden Sie lokale Deals in der Schweiz',
  subtitle = 'Tausende Artikel von Verkäufern in Ihrer Nähe',
  children,
}: HeroServerProps) {
  return (
    <section
      className="relative overflow-hidden py-8 text-white md:py-12"
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
        {/* Single-Column Layout: Search-focused */}
        <div className="mx-auto max-w-3xl">
          {/* LCP-OPTIMIERT: H1 ist sofort im HTML, kein JavaScript nötig */}
          <h1 className="mb-3 text-center text-3xl font-bold text-white md:mb-4 md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mb-6 text-center text-base text-white/90 md:mb-8 md:text-lg">
            {subtitle}
          </p>
          {/* Slot für Client Component (Search) - Large, dominant */}
          <div className="mx-auto max-w-3xl mb-3">
            {children}
          </div>

          {/* Trust Mini-Bullets - Under search bar */}
          <TrustMiniBullets variant="hero" />
        </div>
      </div>
    </section>
  )
}
