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
    <div className={`mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] ${
      isHero ? 'text-white/80' : 'text-gray-600'
    }`}>
      {TRUST_BULLETS.map((bullet, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          <Check className={`h-4 w-4 ${isHero ? 'text-white/70' : 'text-gray-500'}`} />
          <span className="whitespace-nowrap">{bullet}</span>
        </span>
      ))}
    </div>
  )
}
