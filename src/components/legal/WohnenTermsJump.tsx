'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { LegalPageSurface } from '@/lib/legal-page-surface'
import Link from 'next/link'

export function WohnenTermsJump({ surface }: { surface: LegalPageSurface }) {
  const { t } = useLanguage()
  if (surface !== 'wohnen') return null

  const w = t.wohnenSupport

  return (
    <div className="mb-6 rounded-lg border border-[#d4eee4] bg-[#f5fdfb] px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-sm leading-relaxed text-[#3d5c50] sm:text-base">{w.termsJump}</p>
      <Link
        href="#helvenda-wohnungen"
        className="mt-2 inline-block text-sm font-semibold text-[#107a5a] hover:text-[#0d6550] hover:underline"
      >
        {w.termsJumpLink}
      </Link>
    </div>
  )
}
