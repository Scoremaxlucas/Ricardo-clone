'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { ArticleSkeleton } from '@/components/ui/ArticleSkeleton'
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
  const [visibleCount, setVisibleCount] = useState(3) // Progressive loading: zeige zuerst 3

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // OPTIMIERT: Verwende search API-Route (zuverlässiger)
        // Fallback zu fast route falls nötig
        let response = await fetch('/api/articles/search?limit=6', {
          cache: 'no-store',
        })
        
        // Fallback zu fast route falls search fehlschlägt
        if (!response.ok) {
          response = await fetch('/api/articles/fast?limit=6', {
            cache: 'no-store',
          })
        }
        if (response.ok) {
          const data = await response.json()
          const fetchedItems = Array.isArray(data.watches) ? data.watches : []
          setItems(fetchedItems)

          // OPTIMIERT: Progressive Loading - zeige zuerst 3 Artikel sofort
          if (fetchedItems.length > 0) {
            setVisibleCount(3)
            // Lade restliche Artikel nach kurzer Verzögerung
            if (fetchedItems.length > 3) {
              setTimeout(() => setVisibleCount(fetchedItems.length), 100)
            }
          }
        } else {
          setItems([])
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
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
      <section className="bg-[#FAFAFA] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
              {t.home.featured}
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">{t.home.discoverLatest}</p>
          </div>
          <ArticleSkeleton count={6} variant="grid" />
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
          {items.slice(0, visibleCount).map(product => (
            <div key={product.id} className="flex h-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
          {loading && items.length > visibleCount && (
            <ArticleSkeleton count={items.length - visibleCount} variant="grid" />
          )}
        </div>
      </div>
    </section>
  )
}
