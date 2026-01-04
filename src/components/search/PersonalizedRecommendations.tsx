'use client'

import { ProductCard } from '@/components/ui/ProductCard'
import { ChevronLeft, ChevronRight, Eye, Heart, Loader2, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface RecommendedProduct {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  images: string[]
  condition: string
  isAuction: boolean
  auctionEnd: string | null
  createdAt: string
  sellerId: string
  recommendationType: 'browsing' | 'favorites' | 'purchases' | 'category' | 'trending'
  recommendationReason: string
}

interface PersonalizedRecommendationsProps {
  title?: string
  limit?: number
  type?: 'all' | 'browsing' | 'favorites' | 'purchases' | 'trending'
  className?: string
  showTypeIcon?: boolean
}

const typeIcons = {
  browsing: Eye,
  favorites: Heart,
  purchases: ShoppingBag,
  category: Sparkles,
  trending: TrendingUp,
}

const typeColors = {
  browsing: 'bg-blue-100 text-blue-600',
  favorites: 'bg-red-100 text-red-600',
  purchases: 'bg-green-100 text-green-600',
  category: 'bg-purple-100 text-purple-600',
  trending: 'bg-amber-100 text-amber-600',
}

export function PersonalizedRecommendations({
  title = 'Für Sie empfohlen',
  limit = 12,
  type = 'all',
  className = '',
  showTypeIcon = true,
}: PersonalizedRecommendationsProps) {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPersonalized, setIsPersonalized] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/recommendations/personalized?limit=${limit}&type=${type}`)
        if (!res.ok) throw new Error('Failed to fetch recommendations')
        const data = await res.json()
        setProducts(data.recommendations || [])
        setIsPersonalized(data.personalized || false)
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError('Konnte Empfehlungen nicht laden')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [limit, type])

  // Update scroll button visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      window.addEventListener('resize', updateScrollButtons)
      return () => {
        container.removeEventListener('scroll', updateScrollButtons)
        window.removeEventListener('resize', updateScrollButtons)
      }
    }
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (error || products.length === 0) {
    return null // Don't show section if no recommendations
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPersonalized ? (
            <Sparkles className="h-5 w-5 text-primary-600" />
          ) : (
            <TrendingUp className="h-5 w-5 text-amber-500" />
          )}
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            {isPersonalized ? title : 'Beliebt auf Helvenda'}
          </h2>
          {isPersonalized && (
            <span className="ml-2 hidden rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 sm:inline">
              Personalisiert
            </span>
          )}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Zurück scrollen"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Weiter scrollen"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scroll-smooth"
        >
          {products.map(product => {
            const TypeIcon = typeIcons[product.recommendationType]
            const colorClass = typeColors[product.recommendationType]
            
            return (
              <div
                key={product.id}
                className="w-[200px] flex-shrink-0 sm:w-[220px] md:w-[250px]"
              >
                <ProductCard
                  watch={{
                    id: product.id,
                    title: product.title,
                    brand: product.brand,
                    model: product.model,
                    price: product.price,
                    buyNowPrice: product.buyNowPrice,
                    images: product.images,
                    condition: product.condition,
                    isAuction: product.isAuction,
                    auctionEnd: product.auctionEnd,
                    createdAt: product.createdAt,
                    city: null,
                    postalCode: null,
                  }}
                  showFavoriteButton={true}
                  onToggleFavorite={() => {}}
                />
                {/* Recommendation reason badge */}
                {showTypeIcon && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${colorClass}`}>
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {product.recommendationReason}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile scroll indicators */}
        <div className="mt-2 flex justify-center gap-1 sm:hidden">
          {products.slice(0, Math.min(products.length, 8)).map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gray-300"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
