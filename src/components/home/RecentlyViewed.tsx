'use client'

import { useState, useEffect } from 'react'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  isAuction: boolean
  currentBid?: number
  condition?: string
}

export function RecentlyViewed() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Hole die letzten 4 Artikel
        const response = await fetch('/api/watches')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.watches?.slice(0, 4) || [])
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

  if (loading) {
    return null
  }

  if (products.length === 0) {
    return null
  }

  return (
    <>
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">{t.home.recentlyViewed}</h2>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              {...product}
              price={product.isAuction && product.currentBid ? product.currentBid : product.price}
              showCondition={true}
              favorites={favorites}
              onFavoriteToggle={(id, isFavorite) => {
                setFavorites(prev => {
                  const newSet = new Set(prev)
                  if (isFavorite) {
                    newSet.add(id)
                  } else {
                    newSet.delete(id)
                  }
                  return newSet
                })
              }}
            />
          ))}
        </div>
      </div>
    </section>
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Anmeldung erforderlich"
        message={t.favorites.loginRequired}
        loginButtonText="Anmelden"
      />
    </>
  )
}
