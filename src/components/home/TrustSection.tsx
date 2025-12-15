/**
 * TrustSection - Trust & Value Proposition Section
 * 
 * Server Component für SEO
 * Zeigt 3-4 wichtige Trust-Punkte
 * Lightweight, subtle design mit weißem/hellgrauem Hintergrund
 */

import { MapPin, Shield, Zap } from 'lucide-react'

const trustPoints = [
  {
    icon: MapPin,
    title: 'Schweizer Marktplatz',
    description: '100% lokal',
  },
  {
    icon: MapPin,
    title: 'Lokale Deals',
    description: 'Deals in Ihrer Nähe',
  },
  {
    icon: Shield,
    title: 'Sichere Kommunikation',
    description: 'Geschützte Nachrichten',
  },
  {
    icon: Zap,
    title: 'Schnelle Einstellung',
    description: 'In Minuten online',
  },
]

export function TrustSection() {
  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => {
            const IconComponent = point.icon
            return (
              <div
                key={index}
                className="group flex flex-col items-center gap-3 rounded-xl bg-white p-6 text-center transition-all duration-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-all duration-200 group-hover:bg-primary-100 group-hover:scale-105">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {point.title}
                </h3>
                <p className="text-sm text-gray-600">{point.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
