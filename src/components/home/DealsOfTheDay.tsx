'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'

interface Product {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
}

export function TopAngebote() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchTopAngebote = async () => {
      setLoading(true)
      try {
        // Hole günstige Angebote (unter CHF 100) oder beste Preis-Leistung
        const response = await fetch('/api/watches?limit=20')
        if (response.ok) {
          const data = await response.json()
          const watches = data.watches || data || []

          // Filtere günstige Angebote (unter CHF 100) oder sortiere nach Preis
          const affordable = watches
            .filter((watch: any) => watch.price <= 100)
            .sort((a: any, b: any) => a.price - b.price)
            .slice(0, 6)

          // Falls nicht genug unter CHF 100, nimm die günstigsten insgesamt
          if (affordable.length < 6) {
            const cheapest = watches.sort((a: any, b: any) => a.price - b.price).slice(0, 6)
            setProducts(cheapest)
          } else {
            setProducts(affordable)
          }
        }
      } catch (error) {
        console.error('Error fetching top angebote:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopAngebote()
  }, [])

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

    if (!session?.user) return

    try {
      const method = favorites.has(watchId) ? 'DELETE' : 'POST'
      await fetch(`/api/favorites/${watchId}`, { method })

      setFavorites(prev => {
        const newSet = new Set(prev)
        if (favorites.has(watchId)) {
          newSet.delete(watchId)
        } else {
          newSet.add(watchId)
        }
        return newSet
      })
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
    <section className="bg-primary-50 py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary-600 p-3 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Top Angebote</h2>
              <p className="mt-1 text-gray-600">Günstige Schnäppchen für Sie</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-2 text-green-700 shadow-md md:flex">
            <TrendingDown className="h-5 w-5" />
            <span className="text-sm font-semibold">Unter CHF 100</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {products.map(product => (
            <div key={product.id} className="relative">
              {/* Günstig Badge - Custom für DealsOfTheDay */}
              {product.price <= 100 && (
                <div className="absolute left-2 top-2 z-20 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
                  Günstig
                </div>
              )}
              <ProductCard
                {...product}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
