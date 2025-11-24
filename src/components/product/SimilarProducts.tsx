'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Sparkles, Heart, MapPin, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Product {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
  condition?: string
  city?: string
  postalCode?: string
  isAuction?: boolean
  auctionEnd?: string
  buyNowPrice?: number
  bids?: any[]
}

interface SimilarProductsProps {
  currentProductId: string
  brand: string
  category?: string
  priceRange?: number
}

export function SimilarProducts({ currentProductId, brand, category, priceRange = 1000 }: SimilarProductsProps) {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        // Suche ähnliche Produkte basierend auf Marke
        let url = `/api/watches/search?q=${encodeURIComponent(brand)}&limit=6`
        
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          // Filtere das aktuelle Produkt aus
          const similar = (data.watches || [])
            .filter((p: Product) => p.id !== currentProductId)
            .slice(0, 6)
          
          setProducts(similar)
        }
      } catch (error) {
        console.error('Error fetching similar products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [currentProductId, brand])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return
      
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }
    
    fetchFavorites()
  }, [session?.user])

  const toggleFavorite = async (watchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) {
      alert('Bitte melden Sie sich an, um Favoriten hinzuzufügen')
      return
    }

    try {
      const method = favorites.has(watchId) ? 'DELETE' : 'POST'
      const response = await fetch(`/api/favorites/${watchId}`, { method })
      
      if (response.ok) {
        setFavorites(prev => {
          const newSet = new Set(prev)
          if (favorites.has(watchId)) {
            newSet.delete(watchId)
          } else {
            newSet.add(watchId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center text-gray-500">
          Lade ähnliche Artikel...
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Ähnliche Artikel
        </h3>
      </div>

      {/* Grid - Gleiche Formatierung wie Homepage/Suche */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
        {products.map((product) => {
          const images = typeof product.images === 'string' 
            ? JSON.parse(product.images) 
            : product.images || []

          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {images[0] ? (
                  <img
                    src={images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Kein Bild
                  </div>
                )}
                <button
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className={`absolute top-1.5 right-1.5 rounded-full p-1 shadow-md transition-all ${
                    favorites.has(product.id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="p-1">
                {product.brand && (
                  <div className="text-[10px] font-medium text-primary-600 mb-0.5 truncate">{product.brand}</div>
                )}
                <div className="font-medium text-gray-900 text-xs line-clamp-2 mb-0.5 min-h-[20px] leading-tight">
                  {product.title}
                </div>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-xs font-bold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(product.price)}
                  </div>
                  {product.buyNowPrice && (
                    <div className="text-[10px] text-gray-500">
                      Sofort: {new Intl.NumberFormat('de-CH').format(product.buyNowPrice)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 flex-wrap">
                  {(product.city || product.postalCode) && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {product.city && product.postalCode 
                        ? `${product.city} ${product.postalCode}`
                        : product.city || product.postalCode}
                    </span>
                  )}
                  {product.isAuction && product.auctionEnd && (
                    <span className="flex items-center gap-0.5 text-orange-600">
                      <Clock className="h-2.5 w-2.5" />
                      {(() => {
                        const end = new Date(product.auctionEnd)
                        const now = new Date()
                        const diff = end.getTime() - now.getTime()
                        if (diff <= 0) return 'Beendet'
                        const hours = Math.floor(diff / (1000 * 60 * 60))
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                        if (hours > 24) return `${Math.floor(hours / 24)}d`
                        if (hours > 0) return `${hours}h`
                        return `${minutes}m`
                      })()}
                    </span>
                  )}
                  {product.isAuction && product.bids && product.bids.length > 0 && (
                    <span className="text-gray-600">
                      ({product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'})
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/search?q=${encodeURIComponent(brand)}`}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Alle {brand} Artikel ansehen →
        </Link>
      </div>
    </div>
  )
}

