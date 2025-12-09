'use client'

import { Suspense, lazy, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load below-the-fold components
const LazyTrendingNow = lazy(() =>
  import('@/components/home/TrendingNow').then(m => ({ default: m.TrendingNow }))
)
const LazyCategorySpotlight = lazy(() =>
  import('@/components/home/CategorySpotlight').then(m => ({ default: m.CategorySpotlight }))
)

export function HomeClient() {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)
  const { t } = useLanguage()

  useEffect(() => {
    let isMounted = true
    
    // Prüfe ob Verifizierung gerade abgeschickt wurde
    const verificationSubmitted = searchParams.get('verificationSubmitted')
    if (verificationSubmitted === 'true' && !hasShownToast.current && isMounted) {
      hasShownToast.current = true

      // Entferne Query-Parameter aus URL
      const url = new URL(window.location.href)
      url.searchParams.delete('verificationSubmitted')
      window.history.replaceState({}, '', url.toString())

      // Zeige Erfolgs-Toast nur wenn Component noch gemountet ist
      if (isMounted) {
        toast.success(t.verification.submitted, {
          duration: 6000,
          icon: '✅',
        })
      }
    }

    return () => {
      isMounted = false
    }
  }, [searchParams, t])

  return (
    <>
      {/* Trending Now - Lazy loaded */}
      <Suspense
        fallback={
          <div className="bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          </div>
        }
      >
        <LazyTrendingNow />
      </Suspense>

      {/* Category Spotlight - Lazy loaded */}
      <Suspense
        fallback={
          <div className="bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          </div>
        }
      >
        <LazyCategorySpotlight />
      </Suspense>
    </>
  )
}

