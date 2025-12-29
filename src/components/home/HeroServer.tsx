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
}

export function HeroServer({
  title = 'Finden Sie lokale Deals in der Schweiz',
}: HeroServerProps) {
  return (
    <section
      id="home-hero"
      className="relative py-4 text-white md:py-5 lg:py-3"
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
        <div className="flex flex-col items-center justify-center text-center">
          {/* LCP-OPTIMIERT: H1 ist sofort im HTML, kein JavaScript nötig */}
          <h1 className="text-xl font-bold text-white md:text-2xl lg:text-xl">
            {title}
          </h1>

          {/* Trust Mini-Bullets - direkt unter Titel */}
          <TrustMiniBullets variant="hero" />
        </div>
      </div>
    </section>
  )
}
