'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'

interface LegalPageWrapperProps {
  titleKey: 'terms' | 'privacy' | 'fees' | 'imprint' | 'withdrawalRights'
  validSince?: string
  /** Helvenda Wohnungen: surface aligned with tenant marketing (teal frame, deep green titles). */
  surface?: 'default' | 'wohnen'
  children: React.ReactNode
}

/**
 * Wrapper for legal pages that adds translated title and
 * a language notice for non-German users.
 */
export function LegalPageWrapper({ titleKey, validSince, surface = 'default', children }: LegalPageWrapperProps) {
  const { t, language } = useLanguage()
  const title = t.legalPages[titleKey].title
  const isNonGerman = language !== 'de'
  const wohnen = surface === 'wohnen'

  return (
    <div
      className={cn(
        'bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-12',
        wohnen
          ? 'rounded-2xl border border-[#d4eee4] shadow-[0_12px_40px_-20px_rgba(13,43,31,0.12)]'
          : 'rounded-lg border border-gray-200'
      )}
    >
      <h1
        className={cn(
          'mb-2 text-2xl font-bold sm:text-3xl',
          wohnen ? 'font-extrabold tracking-[-0.02em] text-[#0d2b1f]' : 'text-gray-900'
        )}
      >
        {title}
      </h1>
      {validSince && (
        <p className={cn('mb-4 text-sm sm:text-base', wohnen ? 'text-[#5a7a6e]' : 'text-gray-600')}>
          {t.legalPages.validSince} {validSince}
        </p>
      )}

      {wohnen && (
        <p className="mb-6 rounded-lg border border-[#d4eee4] bg-[#f5fdfb] px-4 py-3 text-sm leading-relaxed text-[#3d5c50]">
          Diese Unterlagen gelten für Helvenda Wohnungen. Rechtlich sind sie mit den übrigen Helvenda-Diensten
          verbunden; hier lesen Sie sie im Kontext des Mietangebots.
        </p>
      )}

      {isNonGerman && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Globe className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            {t.legalPages.languageNotice}
          </p>
        </div>
      )}

      {children}
    </div>
  )
}
