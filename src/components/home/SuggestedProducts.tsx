'use client'

import { useState, useEffect } from 'react'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
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
  const [activeTab, setActiveTab] = useState<'near' | 'ending' | 'popular' | 'new' | 'cheap'>(
    'popular'
  )
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

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
      setIsLoginModalOpen(true)
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
          body: JSON.stringify({ watchId: productId }),
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
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">{t.home.currentlyOnHelvenda}</h2>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 overflow-x-auto border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors ${
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
          <div className="py-12 text-center text-gray-500">{t.home.loadingItems}</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-xl"
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      {t.home.noImage}
                    </div>
                  )}
                  <button
                    onClick={e => toggleFavorite(product.id, e)}
                    className={`absolute right-2 top-2 rounded-full p-2 shadow-md transition-colors ${
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
                    <Heart
                      className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {product.title}
                  </h3>
                  <div className="text-base font-bold text-gray-900">
                    {product.isAuction && product.currentBid ? (
                      <>
                        {t.common.chf} {product.currentBid.toFixed(2)}
                      </>
                    ) : (
                      <>
                        {t.common.chf} {product.price.toFixed(2)}
                      </>
                    )}
                  </div>
                  {product.isAuction && (
                    <div className="mt-1 text-xs text-gray-500">{t.home.auction}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-lg text-gray-500">{t.home.noItemsAvailable}</p>
            <p className="text-sm text-gray-400">
              {t.home.beFirstToSell}{' '}
              <Link href="/sell" className="font-medium text-primary-600 hover:text-primary-700">
                {t.home.sellNowItem}
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Anmeldung erforderlich"
        message={t.favorites.loginRequired}
        loginButtonText="Anmelden"
      />
  )
}
