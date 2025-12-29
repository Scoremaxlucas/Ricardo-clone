/**
 * HeroServer - Pure Server Component für LCP-Optimierung
 *
 * Der statische Hero-Content wird server-side gerendert für:
 * - Schnelleres LCP (Largest Contentful Paint)
 * - Besseres SEO (Text ist sofort im HTML)
 * - Reduziertes JavaScript Bundle
 *
 * Search ist jetzt im Header (Ricardo-Style) - Hero zeigt nur Branding.
 */

import { TrustMiniBullets } from './TrustMiniBullets'

interface HeroServerProps {
  title?: string
  subtitle?: string
}

export function HeroServer({
  title = 'Finden Sie lokale Deals in der Schweiz',
  subtitle = 'Tausende Artikel von Verkäufern in Ihrer Nähe',
}: HeroServerProps) {
  return (
    <section
      id="home-hero"
      className="relative py-6 text-white md:py-6 lg:py-4"
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
        <div className="mx-auto max-w-3xl text-center">
          {/* LCP-OPTIMIERT: H1 ist sofort im HTML, kein JavaScript nötig */}
          <h1 className="mb-2 text-2xl font-bold text-white md:mb-2 md:text-3xl lg:mb-1 lg:text-2xl">
            {title}
          </h1>
          <p className="mb-3 text-sm text-white/90 md:text-base lg:mb-2 lg:text-sm">{subtitle}</p>

          {/* Trust Mini-Bullets */}
          <TrustMiniBullets variant="hero" />
        </div>
      </div>
    </section>
  )
}
