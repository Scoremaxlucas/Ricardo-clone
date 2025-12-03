'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { useSession } from 'next-auth/react'

interface Item {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice?: number
  isAuction: boolean
  auctionEnd?: string
  images: string[]
  year?: number
  condition: string
  createdAt: string
  boosters?: string[]
  city?: string
  postalCode?: string
}

export function FeaturedProducts() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/watches/search?limit=6', {
          cache: 'force-cache', // Aggressive caching for better performance
          next: { revalidate: 120 }, // Revalidate every 2 minutes
        })
        if (response.ok) {
          const data = await response.json()
          setItems(Array.isArray(data.watches) ? data.watches : []) // API verwendet noch 'watches'
        } else {
          setItems([])
        }
      } catch (error) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/favorites', {
          // Cache favorites for 30 seconds
          next: { revalidate: 30 },
        })
        if (response.ok) {
          const data = await response.json()
          setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
        }
      } catch (error) {
        // Silently fail - favorites are not critical for initial render
      }
    }

    fetchFavorites()
  }, [session?.user])

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">{t.home.loading}</p>
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">{t.home.featured}</h2>
            <p className="text-lg text-gray-600">{t.home.noItemsYet}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#FAFAFA] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            {t.home.featured}
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">{t.home.discoverLatest}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map(product => (
            <div key={product.id} className="flex h-full min-w-0">
              <ProductCard
                {...product}
                showCondition={true}
                showViewButton={true}
                viewButtonText={t.home.viewOffer}
                favorites={favorites}
                className="w-full"
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
