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

import { Shield, Truck, Star } from 'lucide-react'

interface HeroServerProps {
  title?: string
}

export function HeroServer({ title = 'Finden Sie lokale Deals in der Schweiz' }: HeroServerProps) {
  return (
    <section
      id="home-hero"
      className="relative overflow-hidden py-5 text-white sm:py-6 md:py-10"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)',
      }}
    >
      {/* Dekoratives Element links */}
      <div
        className="absolute -left-20 top-0 h-full w-64 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Dekoratives Element rechts */}
      <div
        className="absolute -right-20 top-0 h-full w-64 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Subtiles Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          {/* LCP-OPTIMIERT: H1 ist sofort im HTML, kein JavaScript nötig */}
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 text-base text-white/90 md:text-lg">
            Kaufen &amp; Verkaufen · Schweizer Marktplatz
          </p>

          {/* Trust Badges - Kompakt und modern */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-medium">Käuferschutz</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Truck className="h-4 w-4" />
              </div>
              <span className="font-medium">Schneller Versand</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Star className="h-4 w-4" />
              </div>
              <span className="font-medium">Schweizer Qualität</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
