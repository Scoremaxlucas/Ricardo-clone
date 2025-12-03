'use client'

import { useEffect, useRef, Suspense, lazy } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { QuickAccessBar } from '@/components/home/QuickAccessBar'
import { Footer } from '@/components/layout/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load below-the-fold components for better initial load performance
const TrendingNow = lazy(() => import('@/components/home/TrendingNow').then(m => ({ default: m.TrendingNow })))
const FeaturedProducts = lazy(() => import('@/components/home/FeaturedProducts').then(m => ({ default: m.FeaturedProducts })))
const CategorySpotlight = lazy(() => import('@/components/home/CategorySpotlight').then(m => ({ default: m.CategorySpotlight })))

export default function Home() {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Prüfe ob Verifizierung gerade abgeschickt wurde
    const verificationSubmitted = searchParams.get('verificationSubmitted')
    if (verificationSubmitted === 'true' && !hasShownToast.current) {
      // Markiere als angezeigt, damit es nicht nochmal angezeigt wird
      hasShownToast.current = true

      // Entferne Query-Parameter aus URL zuerst (bevor Toast angezeigt wird)
      const url = new URL(window.location.href)
      url.searchParams.delete('verificationSubmitted')
      window.history.replaceState({}, '', url.toString())

      // Zeige Erfolgs-Toast nur einmal
      toast.success(t.verification.submitted, {
        duration: 6000,
        icon: '✅',
      })
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 pb-8">
        {/* Hero Section */}
        <Hero />

        {/* Quick Access Bar - Moderne Filter */}
        <QuickAccessBar />

        {/* Featured Products - Neueste Artikel - Lazy loaded */}
        <Suspense fallback={<div className="bg-gray-50 py-16"><div className="mx-auto max-w-7xl px-4 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div></div></div>}>
          <FeaturedProducts />
        </Suspense>

        {/* Trending Now - Was gerade angesagt ist - Lazy loaded */}
        <Suspense fallback={<div className="bg-gray-50 py-16"><div className="mx-auto max-w-7xl px-4 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div></div></div>}>
          <TrendingNow />
        </Suspense>

        {/* Category Spotlight - Interaktive Kategorie-Showcases - Lazy loaded */}
        <Suspense fallback={<div className="bg-gray-50 py-16"><div className="mx-auto max-w-7xl px-4 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div></div></div>}>
          <CategorySpotlight />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
