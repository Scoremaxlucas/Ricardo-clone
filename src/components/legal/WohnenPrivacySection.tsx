'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { LegalPageSurface } from '@/lib/legal-page-surface'

/** Rental-specific privacy summary at the top on wohnen.helvenda.ch */
export function WohnenPrivacySection({ surface }: { surface: LegalPageSurface }) {
  const { t } = useLanguage()
  if (surface !== 'wohnen') return null

  const p = t.wohnenSupport.privacySection

  return (
    <section className="mb-8 rounded-2xl border border-[#d4eee4] bg-[#f5fdfb] p-5 sm:p-6">
      <h2 className="mb-2 text-lg font-bold text-[#0d2b1f] sm:text-xl">{p.title}</h2>
      <p className="mb-4 text-sm leading-relaxed text-[#3d5c50] sm:text-base">{p.intro}</p>
      <ul className="space-y-4">
        {p.items.map(item => (
          <li key={item.heading}>
            <h3 className="text-sm font-semibold text-[#0d2b1f] sm:text-base">{item.heading}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#5a7a6e] sm:text-base">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
