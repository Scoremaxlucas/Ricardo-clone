import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HeroServer } from '@/components/home/HeroServer'
import { HeroSearch } from '@/components/home/HeroSearch'
import { CategoryQuickLinks } from '@/components/home/CategoryQuickLinks'
import { HomeClient } from '@/components/home/HomeClient'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getFeaturedProducts } from '@/lib/products'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

/**
 * Homepage - TTI & LCP Optimiert
 * 
 * JavaScript Loading Priorität:
 * 1. Kritisch (0ms): Header, HeroServer (Text), FeaturedProducts
 * 2. Nach Paint: HeroSearch, CategoryQuickLinks
 * 3. Nach Scroll: QuickAccessBar, HomeClient
 * 
 * TTI Ziel: <100ms (User kann sofort interagieren)
 * LCP Ziel: <2.5s (Hero H1 ist sichtbar)
 */

// OPTIMIERT: QuickAccessBar nur laden wenn sichtbar (nicht kritisch für TTI)
const QuickAccessBar = dynamic(
  () => import('@/components/home/QuickAccessBar').then(m => ({ default: m.QuickAccessBar })),
  { 
    ssr: true, // Server-Side Rendering für SEO
    loading: () => (
      <div className="border-b border-gray-200 bg-gray-50 py-3">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }
)

// ISR: Revalidate alle 60 Sekunden
export const revalidate = 60

// SEO Metadata
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
  const featuredProducts = await getFeaturedProducts(4)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Header />
      <main id="main-content" className="flex-1 pb-8" tabIndex={-1}>
        {/* 
          Hero Section - Kritisch für LCP
          Server Component rendert H1/H2 sofort
        */}
        <HeroServer
          title="Finden Sie genau das, was Sie suchen"
          subtitle="Schweizer Online-Marktplatz für alle Ihre Bedürfnisse"
          sellNowText="Verkaufen Sie jetzt"
          sellNowDescription="Erreichen Sie tausende potenzielle Käufer in der Schweiz"
          sellNowButton="Jetzt Artikel anbieten"
        >
          {/* Search - Client Component mit Skeleton Fallback */}
          <Suspense fallback={
            <div className="flex h-14 items-center rounded-full bg-white/90 px-6 shadow-lg">
              <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
            </div>
          }>
            <HeroSearch placeholder="Suchen Sie nach Produkten, Marken, Kategorien..." />
          </Suspense>
        </HeroServer>

        {/* Category Links - Nach First Paint */}
        <div className="border-t border-primary-700/20 bg-primary-800/50 backdrop-blur-sm">
          <Suspense fallback={<div className="h-20" />}>
            <CategoryQuickLinks />
          </Suspense>
        </div>

        {/* Quick Access Bar - Dynamisch geladen */}
        <QuickAccessBar />

        {/* Featured Products - Server-Side gerendert */}
        <FeaturedProductsServer initialProducts={featuredProducts} />

        {/* Below-the-fold - Lazy loaded mit null Fallback */}
        <Suspense fallback={null}>
          <HomeClient featuredProductIds={featuredProducts.map(p => p.id)} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
