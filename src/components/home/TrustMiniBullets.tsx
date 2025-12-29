/**
 * TrustMiniBullets - Compact informational trust bar
 *
 * Can be used in two contexts:
 * 1. On white background (default) - gray text
 * 2. On hero/green background (hero variant) - white text
 */

import { Check } from 'lucide-react'

const TRUST_BULLETS = [
  'Schweizer Marktplatz',
  'Optionaler Zahlungsschutz',
  'Schnell eingestellt',
]

interface TrustMiniBulletsProps {
  variant?: 'default' | 'hero'
}

export function TrustMiniBullets({ variant = 'default' }: TrustMiniBulletsProps) {
  const isHero = variant === 'hero'

  return (
    <div className={`mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] lg:mt-2 lg:gap-x-3 lg:text-[11px] ${
      isHero ? 'text-white/80' : 'text-gray-600'
    }`}>
      {TRUST_BULLETS.map((bullet, index) => (
        <span key={index} className="inline-flex items-center gap-1.5 lg:gap-1">
          <Check className={`h-4 w-4 lg:h-3 lg:w-3 ${isHero ? 'text-white/70' : 'text-gray-500'}`} />
          <span className="whitespace-nowrap">{bullet}</span>
        </span>
      ))}
    </div>
  )
}
