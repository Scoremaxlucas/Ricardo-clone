'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useSearchParams } from 'next/navigation'
import { Suspense, lazy, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

// Lazy load below-the-fold components
const LazyTrendingNow = lazy(() =>
  import('@/components/home/TrendingNow').then(m => ({ default: m.TrendingNow }))
)
const LazyCategorySpotlight = lazy(() =>
  import('@/components/home/CategorySpotlight').then(m => ({ default: m.CategorySpotlight }))
)
const LazyLocationMap = lazy(() =>
  import('@/components/home/LocationMap').then(m => ({ default: m.LocationMap }))
)

export function HomeClient() {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)
  const { t } = useLanguage()

  useEffect(() => {
    let isMounted = true

    // Prüfe ob Verifizierung gerade abgeschickt wurde
    const verificationSubmitted = searchParams.get('verificationSubmitted')
    if (verificationSubmitted === 'true' && !hasShownToast.current) {
      hasShownToast.current = true

      // Entferne Query-Parameter aus URL
      if (typeof window !== 'undefined' && isMounted) {
        const url = new URL(window.location.href)
        url.searchParams.delete('verificationSubmitted')
        window.history.replaceState({}, '', url.toString())
      }

      // Zeige Erfolgs-Toast nur wenn Component noch gemountet ist
      // KRITISCH: Verwende setTimeout um sicherzustellen, dass Toast nach Render passiert
      setTimeout(() => {
        if (isMounted) {
          toast.success(t.verification.submitted, {
            duration: 6000,
            icon: '✅',
          })
        }
      }, 0)
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

      {/* Location Map - Lazy loaded */}
      <Suspense
        fallback={
          <div className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          </div>
        }
      >
        <LazyLocationMap />
      </Suspense>
    </>
  )
}
