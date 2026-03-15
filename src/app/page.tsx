import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HeroServer } from '@/components/home/HeroServer'
import { HomeClient } from '@/components/home/HomeClient'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getFeaturedProducts } from '@/lib/products'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

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

// SEO Metadata – keywords für Marktplatz, kaufen, verkaufen, marketplace, selling
export const metadata: Metadata = {
  title: 'Helvenda - Der Schweizer Online-Marktplatz | Kaufen & Verkaufen',
  description:
    'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher – Privat und Händler. Marktplatz, verkaufen, kaufen, Schweiz.',
  keywords: [
    'Helvenda',
    'Schweizer Marktplatz',
    'Online-Marktplatz',
    'kaufen',
    'verkaufen',
    'marketplace',
    'selling',
    'Schweiz',
  ],
  openGraph: {
    title: 'Helvenda - Schweizer Marktplatz | Kaufen & Verkaufen',
    description: 'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher.',
    type: 'website',
    locale: 'de_CH',
    siteName: 'Helvenda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helvenda - Schweizer Marktplatz | Kaufen & Verkaufen',
    description: 'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher.',
  },
  alternates: {
    canonical: 'https://helvenda.ch',
  },
}

export default async function Home() {
  // Server-side fetch für instant rendering
  const featuredProducts = await getFeaturedProducts(10)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Header />
      <main id="main-content" className="flex-1 pb-8" tabIndex={-1}>
        {/*
          Hero Section - Kritisch für LCP
          Server Component rendert H1 sofort
          Search ist jetzt im Header (Ricardo-Style)
        */}
        <HeroServer title="Verkaufen ohne hohe Gebühren – nur 5%, max. CHF 150." />

        {/* Seller Value Callout */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-emerald-900 sm:text-xl">Warum Helvenda?</h2>
              <p className="mt-2 max-w-4xl text-sm text-emerald-800 sm:text-base">
                Bei Ricardo zahlst du bis zu CHF 260 Gebühren pro Verkauf. Bei uns maximal CHF 150 – egal wie teuer dein Artikel ist.
              </p>
              <div className="mt-4">
                <Link
                  href="/sell"
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Jetzt verkaufen
                </Link>
              </div>
            </div>
          </div>
        </section>

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
