'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowDown, ArrowUp, Heart } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'

// LocalStorage key for tracking favorite prices
const FAVORITE_PRICES_KEY = 'helvenda_favorite_prices'

interface FavoritePrice {
  price: number
  savedAt: string
}

// Helper to get/set favorite prices in localStorage
const getFavoritePrices = (): Record<string, FavoritePrice> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(FAVORITE_PRICES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const saveFavoritePrice = (productId: string, price: number): void => {
  if (typeof window === 'undefined') return
  try {
    const prices = getFavoritePrices()
    // Only save if not already saved (preserve original price)
    if (!prices[productId]) {
      prices[productId] = { price, savedAt: new Date().toISOString() }
      localStorage.setItem(FAVORITE_PRICES_KEY, JSON.stringify(prices))
    }
  } catch {
    // Ignore storage errors
  }
}

const removeFavoritePrice = (productId: string): void => {
  if (typeof window === 'undefined') return
  try {
    const prices = getFavoritePrices()
    delete prices[productId]
    localStorage.setItem(FAVORITE_PRICES_KEY, JSON.stringify(prices))
  } catch {
    // Ignore storage errors
  }
}

interface Product {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  condition: string
  isAuction: boolean
  currentBid?: number
  priceChange?: { original: number; direction: 'up' | 'down'; percent: number } | null
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Favoriten — Helvenda.ch'
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/favorites')
      return
    }

    if (status === 'authenticated') {
      fetchFavorites()
    }
  }, [status, router])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      // OPTIMIERT: Verwende fast API-Route für instant loading
      // Lädt alle Favoriten in einem einzigen optimierten Query
      const response = await fetch('/api/articles/favorites-fast')
      if (response.ok) {
        const data = await response.json()
        const watches = data.watches || []
        const savedPrices = getFavoritePrices()

        // Transformiere zu Product-Format
        const products: Product[] = watches.map((w: any) => {
          // Calculate price change
          let priceChange: Product['priceChange'] = null
          const savedPrice = savedPrices[w.id]
          
          if (savedPrice && savedPrice.price !== w.price) {
            const diff = w.price - savedPrice.price
            const percent = Math.abs(Math.round((diff / savedPrice.price) * 100))
            priceChange = {
              original: savedPrice.price,
              direction: diff > 0 ? 'up' : 'down',
              percent
            }
          } else if (!savedPrice) {
            // Save current price for future comparisons
            saveFavoritePrice(w.id, w.price)
          }

          return {
            id: w.id,
            title: w.title,
            brand: w.brand,
            model: w.model,
            price: w.price,
            images: w.images || [],
            condition: w.condition || '',
            isAuction: w.isAuction || false,
            currentBid: w.price, // Bei Auktionen ist price bereits der aktuelle Preis
            priceChange,
          }
        })

        setFavorites(products)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (productId: string) => {
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setFavorites(prev => prev.filter(p => p.id !== productId))
        // Also remove saved price
        removeFavoritePrice(productId)
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:py-8 lg:px-8">
          <ProductGridSkeleton />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:py-8 lg:px-8">
        {/* Breadcrumb - hidden on small mobile */}
        <div className="mb-3 hidden text-sm text-gray-600 sm:block md:mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Startseite
          </Link>
          <span className="mx-2">›</span>
          <span>Meine Favoriten</span>
        </div>

        {/* Header */}
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Heart className="h-6 w-6 fill-current text-red-500 md:h-8 md:w-8" />
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">Meine Favoriten</h1>
          </div>
          <div className="text-xs text-gray-600 md:text-sm">
            {favorites.length} {favorites.length === 1 ? 'Artikel' : 'Artikel'}
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center md:p-12">
            <Heart className="mx-auto mb-3 h-12 w-12 text-gray-300 md:mb-4 md:h-16 md:w-16" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900 md:text-xl">Noch keine Favoriten</h2>
            <p className="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">
              Fügen Sie Artikel zu Ihren Favoriten hinzu, um sie später schnell wiederzufinden.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-[50px] bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-700 active:translate-y-0 active:scale-[0.98] md:px-6 md:py-3 md:text-base"
              style={{
                boxShadow: '0px 4px 20px rgba(13, 148, 136, 0.3)',
              }}
            >
              Artikel durchstöbern
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {favorites.map(product => {
              // Transform Product to ProductCardData format
              const productCardData: ProductCardData = {
                id: product.id,
                title: product.title,
                brand: product.brand,
                model: product.model,
                price: product.price,
                images: product.images || [],
                condition: product.condition,
                isAuction: product.isAuction,
                currentBid: product.currentBid,
                href: `/products/${product.id}`,
              }

              return (
                <div key={product.id} className="relative h-full">
                  {/* Price Change Badge */}
                  {product.priceChange && (
                    <div 
                      className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${
                        product.priceChange.direction === 'down' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {product.priceChange.direction === 'down' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {product.priceChange.percent}%
                    </div>
                  )}
                  <ProductCard
                    product={productCardData}
                    variant="default"
                    showCondition={true}
                    onFavoriteToggle={async (productId, isFavorite) => {
                      if (!isFavorite) {
                        // Remove from favorites
                        await removeFavorite(productId)
                      }
                    }}
                    className="h-full"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
