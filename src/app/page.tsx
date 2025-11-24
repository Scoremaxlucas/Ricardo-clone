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

export default function Home() {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)

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
      toast.success(
        'Ihre Verifizierung wurde eingereicht und wird nun von unserem Team geprüft. Sie erhalten eine Benachrichtigung, sobald die Verifizierung abgeschlossen ist.',
        {
          duration: 6000,
          icon: '✅',
        }
      )
    }
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
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
