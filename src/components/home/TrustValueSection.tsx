/**
 * TrustValueSection - Subtle Trust & Value Reassurance Strip
 * 
 * Quiet reassurance strip that supports confidence without drawing attention.
 * Positioned as a gentle transition between categories and listings.
 * 
 * Design principles:
 * - 30-40% reduced visual weight
 * - No marketing section feeling
 * - Concise copy
 * - Anchored close to listings
 * - Not clickable
 */

import { Shield, MapPin, MessageCircle, Zap } from 'lucide-react'

const valuePoints = [
  {
    icon: Shield,
    title: 'Schweizer Marktplatz',
    description: 'Sicherer Handel',
  },
  {
    icon: MapPin,
    title: 'Lokal',
    description: 'In Ihrer Nähe',
  },
  {
    icon: MessageCircle,
    title: 'Sichere Kommunikation',
    description: 'Geschützt',
  },
  {
    icon: Zap,
    title: 'Schnell & einfach',
    description: 'In Minuten',
  },
]

export function TrustValueSection() {
  return (
    <section className="border-t border-gray-50 bg-white py-4 md:py-5">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {valuePoints.map((point, index) => {
            const IconComponent = point.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1 text-center"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 sm:h-9 sm:w-9">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-xs font-medium text-gray-700 sm:text-sm">
                  {point.title}
                </h3>
                <p className="text-[10px] text-gray-500 sm:text-xs">
                  {point.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
