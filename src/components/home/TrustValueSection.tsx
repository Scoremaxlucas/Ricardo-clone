/**
 * TrustValueSection - Trust & Value Proposition Section
 * 
 * Lightweight, visually subtle section reinforcing confidence:
 * - Swiss marketplace
 * - Local buying & selling
 * - Secure communication
 * - Fast & easy listings
 * 
 * Placed below categories or above listings
 */

import { Shield, MapPin, MessageCircle, Zap } from 'lucide-react'

const valuePoints = [
  {
    icon: Shield,
    title: 'Schweizer Marktplatz',
    description: 'Sicherer Handel in der Schweiz',
  },
  {
    icon: MapPin,
    title: 'Lokal kaufen & verkaufen',
    description: 'Artikel von Verkäufern in Ihrer Nähe',
  },
  {
    icon: MessageCircle,
    title: 'Sichere Kommunikation',
    description: 'Geschützter Nachrichtenaustausch',
  },
  {
    icon: Zap,
    title: 'Schnell & einfach',
    description: 'In wenigen Minuten inserieren',
  },
]

export function TrustValueSection() {
  return (
    <section className="border-t border-gray-100 bg-white py-8 md:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {valuePoints.map((point, index) => {
            const IconComponent = point.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors duration-200 sm:h-14 sm:w-14">
                  <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                  {point.title}
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
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
