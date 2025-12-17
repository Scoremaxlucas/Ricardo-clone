/**
 * TrustMiniBullets - Compact informational trust bar
 *
 * Subtle trust bullets placed right under category icons.
 * Purely informational, non-clickable, no hover states.
 * Supports the top section without interrupting browsing flow.
 */

import { Check } from 'lucide-react'

const TRUST_BULLETS = [
  'Schweizer Marktplatz',
  'Zahlungsschutz optional',
  'Sicherer Chat',
  'Schnell eingestellt',
]

export function TrustMiniBullets() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-gray-600">
        {TRUST_BULLETS.map((bullet, index) => (
          <span key={index} className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-gray-500" />
            <span className="whitespace-nowrap">{bullet}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

