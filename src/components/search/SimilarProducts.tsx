'use client'

import { ProductCard } from '@/components/ui/ProductCard'
import { ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SimilarProduct {
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
  seller: {
    city: string | null
    postalCode: string | null
  } | null
  similarityScore: number
  similarityReason: string
}

interface SimilarProductsProps {
  watchId: string
  title?: string
  limit?: number
  className?: string
}

export function SimilarProducts({
  watchId,
  title = 'Ähnliche Artikel',
  limit = 8,
  className = '',
}: SimilarProductsProps) {
  const [products, setProducts] = useState<SimilarProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/watches/${watchId}/similar?limit=${limit}`)
        if (!res.ok) throw new Error('Failed to fetch similar products')
        const data = await res.json()
        setProducts(data.similar || [])
      } catch (err) {
        console.error('Error fetching similar products:', err)
        setError('Konnte ähnliche Artikel nicht laden')
      } finally {
        setLoading(false)
      }
    }

    if (watchId) {
      fetchSimilar()
    }
  }, [watchId, limit])

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
        <h2 className="mb-4 text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (error || products.length === 0) {
    return null // Don't show section if no similar products
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
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
          className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-4"
        >
          {products.map(product => (
            <div key={product.id} className="w-[200px] flex-shrink-0 sm:w-[220px] md:w-[250px]">
              <ProductCard
                product={{
                  id: product.id,
                  title: product.title,
                  brand: product.brand,
                  model: product.model,
                  price: product.price,
                  buyNowPrice: product.buyNowPrice ?? undefined,
                  images: product.images,
                  condition: product.condition,
                  isAuction: product.isAuction,
                  auctionEnd: product.auctionEnd ?? undefined,
                  createdAt: product.createdAt,
                  city: product.seller?.city ?? undefined,
                  postalCode: product.seller?.postalCode ?? undefined,
                }}
              />
              {/* Similarity reason badge */}
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  <Package className="mr-1 h-3 w-3" />
                  {product.similarityReason}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicators */}
        <div className="mt-2 flex justify-center gap-1 sm:hidden">
          {products.slice(0, Math.min(products.length, 8)).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          ))}
        </div>
      </div>
    </div>
  )
}
