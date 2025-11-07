import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { Categories } from '@/components/home/Categories'
import { BoostedProducts } from '@/components/home/BoostedProducts'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Hero />
        <Categories />
        <BoostedProducts boosterType="super-boost" />
        <BoostedProducts boosterType="turbo-boost" />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  )
}
