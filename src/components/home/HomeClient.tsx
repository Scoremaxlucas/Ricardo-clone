'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
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
const LazySocialProofWidget = lazy(() =>
  import('@/components/home/SocialProofWidget').then(m => ({ default: m.SocialProofWidget }))
)
const LazyLocationMap = lazy(() =>
  import('@/components/home/LocationMap').then(m => ({ default: m.LocationMap }))
)
const LazyPersonalizedFeed = lazy(() =>
  import('@/components/home/PersonalizedFeed').then(m => ({ default: m.PersonalizedFeed }))
)
const LazyDailyDeals = lazy(() =>
  import('@/components/home/DailyDeals').then(m => ({ default: m.DailyDeals }))
)

interface HomeClientProps {
  featuredProductIds?: string[]
}

export function HomeClient({ featuredProductIds = [] }: HomeClientProps) {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)
  const { t } = useLanguage()
  const { data: session } = useSession()

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

  // Update user streak on page visit (Feature 9: Gamification)
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/streak', { method: 'POST' }).catch(err => {
        console.error('[HomeClient] Error updating streak:', err)
      })
    }
  }, [session?.user?.id])

  return (
    <>
      {/* Social Proof Widget - Feature 2 */}
      {featuredProductIds.length > 0 && (
        <Suspense
          fallback={
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 py-8">
              <div className="mx-auto max-w-[1600px] px-4 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              </div>
            </div>
          }
        >
          <LazySocialProofWidget watchIds={featuredProductIds} />
        </Suspense>
      )}

      {/* Personalized Feed - Feature 5 */}
      <Suspense
        fallback={
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          </div>
        }
      >
        <LazyPersonalizedFeed />
      </Suspense>

      {/* Daily Deals - Feature 9 */}
      <Suspense
        fallback={
          <div className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          </div>
        }
      >
        <LazyDailyDeals />
      </Suspense>

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

      {/* Location Map - Feature 3 */}
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
