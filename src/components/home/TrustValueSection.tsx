/**
 * TrustValueSection - Optimized Trust & Value Props Row
 *
 * Subtle but clear trust widgets that are perceived as real benefits.
 * Consistent with Helvenda aesthetics, clean spacing between categories and "Neu eingestellt".
 *
 * Design principles:
 * - Centered container (max-w-6xl)
 * - Grid layout (2 cols mobile, 4 cols desktop)
 * - Clickable cards with hover states
 * - Clear typography with good contrast
 * - No "Lokal/In Ihrer Nähe" (Map/PLZ removed)
 */

import { ChevronRight, MessageCircle, Shield, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

const TRUST_ITEMS = [
  {
    title: 'Schweizer Marktplatz',
    subtitle: 'Für Käufer & Verkäufer in der Schweiz',
    icon: Shield,
    href: '/about',
  },
  {
    title: 'Zahlungsschutz (optional)',
    subtitle: 'Geld wird erst nach Erhalt freigegeben',
    icon: ShieldCheck,
    href: '/help/zahlungsschutz',
  },
  {
    title: 'Sichere Kommunikation',
    subtitle: 'Nachrichten bleiben auf Helvenda',
    icon: MessageCircle,
    href: '/help/sicherheit',
  },
  {
    title: 'Schnell eingestellt',
    subtitle: 'In wenigen Minuten online',
    icon: Zap,
    href: '/sell',
  },
]

export function TrustValueSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TRUST_ITEMS.map((item, index) => {
            const IconComponent = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {/* Icon Container */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition group-hover:bg-gray-200 group-hover:text-gray-900">
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Text Container */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-semibold leading-5 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-[12px] leading-4 text-gray-600">{item.subtitle}</p>
                </div>

                {/* Chevron (Desktop only) */}
                <ChevronRight className="ml-auto hidden h-4 w-4 text-gray-400 transition group-hover:text-gray-600 md:inline-flex" />
              </Link>
            )
          })}
        </div>
      </div>
      {/* Subtle divider */}
      <div className="border-b border-gray-100" />
    </section>
  )
}
