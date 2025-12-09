import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { QuickAccessBar } from '@/components/home/QuickAccessBar'
import { Footer } from '@/components/layout/Footer'
import { getFeaturedProducts } from '@/lib/products'
import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HomeClient } from '@/components/home/HomeClient'
import { ImagePreloader } from '@/components/ImagePreloader'

// OPTIMIERT: ISR mit 60 Sekunden Revalidation für bessere Performance
// Cache wird nach Produktlöschung invalidiert (siehe DELETE endpoint)
export const revalidate = 60
// Entfernt: dynamic = 'force-dynamic' - widerspricht ISR und verhindert Caching
// HINWEIS: VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR=1 wird auf Vercel gesetzt um größere ISR-Pages zu erlauben

export default async function Home() {
  // OPTIMIERT: Fetch products server-side für instant rendering (wie Ricardo)
  // Produkte sind bereits im initial HTML, kein Client-Side API-Call nötig
  // OPTIMIERT: Reduziere auf 4 Produkte um Page-Größe zu reduzieren
  // Die meisten Bilder werden trotzdem sofort angezeigt (Titelbilder <1MB)
  const featuredProducts = await getFeaturedProducts(4)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 pb-8">
        {/* Hero Section */}
        <Hero />

        {/* Quick Access Bar - Moderne Filter */}
        <QuickAccessBar />

        {/* OPTIMIERT: Preload images for instant display */}
        <ImagePreloader products={featuredProducts} />

        {/* Featured Products - Server-Side Rendered für instant display */}
        <FeaturedProductsServer initialProducts={featuredProducts} />

        {/* Client Components für interaktive Features */}
        <Suspense fallback={<div className="py-16 text-center text-gray-600">Lade Inhalte...</div>}>
          <HomeClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
