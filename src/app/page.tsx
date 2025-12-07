import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { QuickAccessBar } from '@/components/home/QuickAccessBar'
import { Footer } from '@/components/layout/Footer'
import { getFeaturedProducts } from '@/lib/products'
import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HomeClient } from '@/components/home/HomeClient'

// Revalidate homepage every 60 seconds for fresh products
export const revalidate = 60

export default async function Home() {
  // OPTIMIERT: Fetch products server-side für instant rendering (wie Ricardo)
  // Produkte sind bereits im initial HTML, kein Client-Side API-Call nötig
  const featuredProducts = await getFeaturedProducts(6)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 pb-8">
        {/* Hero Section */}
        <Hero />

        {/* Quick Access Bar - Moderne Filter */}
        <QuickAccessBar />

        {/* Featured Products - Server-Side Rendered für instant display */}
        <FeaturedProductsServer initialProducts={featuredProducts} />

        {/* Client Components für interaktive Features */}
        <HomeClient />
      </main>
      <Footer />
    </div>
  )
}
