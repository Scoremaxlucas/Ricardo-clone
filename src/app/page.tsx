import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HeroServer } from '@/components/home/HeroServer'
import { HomeClient } from '@/components/home/HomeClient'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getFeaturedProducts } from '@/lib/products'
import { Suspense } from 'react'
import type { Metadata } from 'next'

/**
 * Homepage - TTI & LCP Optimiert
 *
 * Homepage Struktur (nach UX Refactoring):
 * 1. Header (simplified, Categories in header like Ricardo)
 * 2. HeroServer (search-focused, sell secondary)
 * 3. FeaturedProductsServer ("Neu eingestellt")
 * 4. HomeClient (below-the-fold lazy-loaded)
 *
 * JavaScript Loading Priorität:
 * 1. Kritisch (0ms): Header, HeroServer (Text), FeaturedProducts
 * 2. Nach Paint: HeroSearch
 * 3. Nach Scroll: HomeClient
 *
 * TTI Ziel: <100ms (User kann sofort interagieren)
 * LCP Ziel: <2.5s (Hero H1 ist sichtbar)
 */

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
          Server Component rendert H1 sofort
          Search ist jetzt im Header (Ricardo-Style)
        */}
        <HeroServer title="Finden Sie lokale Deals in der Schweiz" />

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
