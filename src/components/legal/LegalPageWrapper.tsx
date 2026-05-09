'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

interface LegalPageWrapperProps {
  titleKey: 'terms' | 'privacy' | 'fees' | 'imprint' | 'withdrawalRights'
  validSince?: string
  children: React.ReactNode
}

/**
 * Wrapper for legal pages that adds translated title and
 * a language notice for non-German users.
 */
export function LegalPageWrapper({ titleKey, validSince, children }: LegalPageWrapperProps) {
  const { t, language } = useLanguage()
  const title = t.legalPages[titleKey].title
  const isNonGerman = language !== 'de'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
      {validSince && (
        <p className="mb-4 text-sm text-gray-600 sm:text-base">
          {t.legalPages.validSince} {validSince}
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
