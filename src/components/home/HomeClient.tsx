'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

/**
 * HomeClient - Below-the-fold Komponenten
 *
 * TTI-Optimierung:
 * - Alle Komponenten sind lazy loaded
 * - Intersection Observer basiertes Loading
 * - Keine Spinner (reduziert Re-Renders)
 * - Skeleton Fallbacks statt Loader
 */

// Lazy imports
const LazyTrendingNow = lazy(() =>
  import('@/components/home/TrendingNow').then(m => ({ default: m.TrendingNow }))
)
const LazyCategorySpotlight = lazy(() =>
  import('@/components/home/CategorySpotlight').then(m => ({ default: m.CategorySpotlight }))
)

const LazyDailyDeals = lazy(() =>
  import('@/components/home/DailyDeals').then(m => ({ default: m.DailyDeals }))
)

// Skeleton Components - Schneller als Spinner, kein JS-Overhead
const SectionSkeleton = ({ bg = 'bg-gray-50' }: { bg?: string }) => (
  <div className={`${bg} py-16`}>
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-8 space-y-3">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  </div>
)

interface HomeClientProps {
  featuredProductIds?: string[]
}

export function HomeClient({ featuredProductIds = [] }: HomeClientProps) {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)
  const { t } = useLanguage()
  const { data: session } = useSession()

  // Intersection Observer State
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Toast für Verifizierung
  useEffect(() => {
    const verificationSubmitted = searchParams.get('verificationSubmitted')
    if (verificationSubmitted === 'true' && !hasShownToast.current) {
      hasShownToast.current = true

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('verificationSubmitted')
        window.history.replaceState({}, '', url.toString())
      }

      // Verzögerter Toast
      setTimeout(() => {
        toast.success(t.verification.submitted, { duration: 6000, icon: '✅' })
      }, 0)
    }
  }, [searchParams, t])

  // Streak Update (deferred)
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      // Verzögere Streak Update um TTI nicht zu blockieren
      const timeout = setTimeout(() => {
        fetch('/api/user/streak', { method: 'POST' }).catch(() => {})
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [(session?.user as { id?: string })?.id])

  // Intersection Observer für Lazy Loading
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '200px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      {/* Erst rendern wenn sichtbar oder fast sichtbar */}
      {isVisible ? (
        <>
          {/* Daily Deals */}
          <Suspense fallback={<SectionSkeleton bg="bg-gradient-to-br from-orange-50 to-red-50" />}>
            <LazyDailyDeals />
          </Suspense>

          {/* Trending Now */}
          <Suspense fallback={<SectionSkeleton />}>
            <LazyTrendingNow />
          </Suspense>

          {/* Category Spotlight */}
          <Suspense fallback={<SectionSkeleton />}>
            <LazyCategorySpotlight />
          </Suspense>
        </>
      ) : (
        // Placeholder bis sichtbar
        <div className="h-[200px]" />
      )}
    </div>
  )
}
