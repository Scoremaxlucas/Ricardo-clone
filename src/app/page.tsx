'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { QuickAccessBar } from '@/components/home/QuickAccessBar'
import { TrendingNow } from '@/components/home/TrendingNow'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { CategorySpotlight } from '@/components/home/CategorySpotlight'
import { Footer } from '@/components/layout/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

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

        {/* Featured Products - Neueste Artikel */}
        <FeaturedProducts />

        {/* Trending Now - Was gerade angesagt ist */}
        <TrendingNow />

        {/* Category Spotlight - Interaktive Kategorie-Showcases (mit geboosteten Produkten) */}
        <CategorySpotlight />
      </main>
      <Footer />
    </div>
  )
}
