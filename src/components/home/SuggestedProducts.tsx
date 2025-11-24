'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  isAuction: boolean
  currentBid?: number
}

export function SuggestedProducts() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'near' | 'ending' | 'popular' | 'new' | 'cheap'>('popular')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/watches')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.watches?.slice(0, 8) || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return
      
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          const favoriteIds = (data.favorites || []).map((f: any) => f.watchId)
          setFavorites(new Set(favoriteIds))
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }
    
    fetchFavorites()
  }, [session?.user])

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      alert(t.favorites.loginRequired)
      return
    }

    const isFavorite = favorites.has(productId)

    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
        if (res.ok) {
          setFavorites(prev => {
            const newSet = new Set(prev)
            newSet.delete(productId)
            return newSet
          })
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId: productId })
        })
        if (res.ok) {
          setFavorites(prev => new Set(prev).add(productId))
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const tabs = [
    { id: 'near', label: t.home.inMyArea },
    { id: 'ending', label: t.home.endingSoon },
    { id: 'popular', label: t.home.popular },
    { id: 'new', label: t.home.new },
    { id: 'cheap', label: t.home.fromOneFranc },
  ]

  return (
    <section className="bg-white py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t.home.currentlyOnHelvenda}
        </h2>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            {t.home.loadingItems}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all block"
              >
                <div className="relative aspect-[5/4] bg-gray-100 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {t.home.noImage}
                    </div>
                  )}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className={`absolute top-2 right-2 rounded-full p-2 shadow-md transition-colors ${
                      favorites.has(product.id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title={
                      !session?.user
                        ? t.favorites.loginRequired
                        : favorites.has(product.id)
                        ? t.product.removeFromFavorites
                        : t.product.addToFavorites
                    }
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600">
                    {product.title}
                  </h3>
                  <div className="text-base font-bold text-gray-900">
                    {product.isAuction && product.currentBid ? (
                      <>{t.common.chf} {product.currentBid.toFixed(2)}</>
                    ) : (
                      <>{t.common.chf} {product.price.toFixed(2)}</>
                    )}
                  </div>
                  {product.isAuction && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t.home.auction}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {t.home.noItemsAvailable}
            </p>
            <p className="text-gray-400 text-sm">
              {t.home.beFirstToSell}{' '}
              <Link href="/sell" className="text-primary-600 hover:text-primary-700 font-medium">
                {t.home.sellNowItem}
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

