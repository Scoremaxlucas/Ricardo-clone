import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HeroServer } from '@/components/home/HeroServer'
import { HeroSearch } from '@/components/home/HeroSearch'
import { CategoryQuickLinks } from '@/components/home/CategoryQuickLinks'
import { HomeClient } from '@/components/home/HomeClient'
import { QuickAccessBar } from '@/components/home/QuickAccessBar'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getFeaturedProducts } from '@/lib/products'
import { Suspense } from 'react'
import type { Metadata } from 'next'

/**
 * Homepage - LCP & ISR Optimiert
 * 
 * Performance-Optimierungen:
 * 1. ISR mit 60s Revalidation - Seite wird gecached
 * 2. HeroServer - H1/Text server-gerendert für schnelleres LCP
 * 3. Search/CategoryLinks als Client in Suspense
 * 4. Featured Products server-side - Bilder im initialen HTML
 * 5. Below-the-fold mit Suspense - Non-blocking
 * 6. Metadata für SEO
 * 
 * LCP Element: Hero H1 "Finden Sie genau das, was Sie suchen"
 * Ziel: LCP < 2.5s (Good)
 */

// ISR: Revalidate alle 60 Sekunden
export const revalidate = 60

// SEO Metadata - Statisch für beste Performance
export const metadata: Metadata = {
  title: 'Helvenda - Der Schweizer Online-Marktplatz',
  description: 'Kaufen und verkaufen Sie einfach und sicher auf dem Schweizer Online-Marktplatz. Tausende Produkte von privaten Verkäufern und Händlern.',
  openGraph: {
    title: 'Helvenda - Der Schweizer Online-Marktplatz',
    description: 'Kaufen und verkaufen Sie einfach und sicher auf dem Schweizer Online-Marktplatz.',
    type: 'website',
    locale: 'de_CH',
    siteName: 'Helvenda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helvenda - Der Schweizer Online-Marktplatz',
    description: 'Kaufen und verkaufen Sie einfach und sicher auf dem Schweizer Online-Marktplatz.',
  },
  alternates: {
    canonical: 'https://helvenda.ch',
  },
}

export default async function Home() {
  // Server-side fetch für instant rendering
  // Produkte sind im initialen HTML = schnelleres LCP
  const featuredProducts = await getFeaturedProducts(4)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 pb-8">
        {/* 
          Hero Section - Composition Pattern
          - HeroServer: Statischer Text (H1, H2) = sofort im HTML
          - HeroSearch: Client Component in Suspense = non-blocking
        */}
        <HeroServer
          title="Finden Sie genau das, was Sie suchen"
          subtitle="Schweizer Online-Marktplatz für alle Ihre Bedürfnisse"
          sellNowText="Verkaufen Sie jetzt"
          sellNowDescription="Erreichen Sie tausende potenzielle Käufer in der Schweiz"
          sellNowButton="Jetzt Artikel anbieten"
        >
          {/* Search als Client Component - blockiert nicht LCP */}
          <Suspense fallback={
            <div className="flex h-14 items-center rounded-full bg-white/90 px-6 shadow-lg">
              <span className="text-gray-400">Suchen...</span>
            </div>
          }>
            <HeroSearch placeholder="Suchen Sie nach Produkten, Marken, Kategorien..." />
          </Suspense>
        </HeroServer>

        {/* Category Quick Links - Client Component, aber unter Hero */}
        <div className="border-t border-primary-700/20 bg-primary-800/50 backdrop-blur-sm">
          <Suspense fallback={<div className="h-20" />}>
            <CategoryQuickLinks />
          </Suspense>
        </div>

        {/* Quick Access Bar - Filter */}
        <QuickAccessBar />

        {/* 
          Featured Products - Server-Side Rendered
          Erste 4 Produkte für schnelles LCP
        */}
        <FeaturedProductsServer initialProducts={featuredProducts} />

        {/* 
          Below-the-fold Content - Lazy loaded
          TrendingNow, CategorySpotlight, etc.
          Blockiert nicht das initiale Rendering
        */}
        <Suspense fallback={null}>
          <HomeClient featuredProductIds={featuredProducts.map(p => p.id)} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
