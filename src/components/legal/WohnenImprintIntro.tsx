'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { LegalPageSurface } from '@/lib/legal-page-surface'

export function WohnenImprintIntro({ surface }: { surface: LegalPageSurface }) {
  const { t } = useLanguage()
  if (surface !== 'wohnen') return null

  return (
    <p className="mb-6 rounded-lg border border-[#d4eee4] bg-[#f5fdfb] px-4 py-3 text-sm leading-relaxed text-[#3d5c50] sm:text-base">
      {t.wohnenSupport.imprintIntro}
    </p>
  )
}
