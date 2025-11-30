'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { useSession } from 'next-auth/react'

interface Watch {
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
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        const response = await fetch('/api/watches/search?limit=6')
        if (response.ok) {
          const data = await response.json()
          setWatches(Array.isArray(data.watches) ? data.watches : [])
        } else {
          console.error('API response not ok:', response.status)
          setWatches([])
        }
      } catch (error) {
        console.error('Error fetching watches:', error)
        setWatches([])
      } finally {
        setLoading(false)
      }
    }
    fetchWatches()
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

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.home.loading}</p>
          </div>
        </div>
      </section>
    )
  }

  if (watches.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t.home.featured}
            </h2>
            <p className="text-lg text-gray-600">
              {t.home.noItemsYet}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            {t.home.featured}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {t.home.discoverLatest}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {watches.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              showCondition={true}
              showViewButton={true}
              viewButtonText={t.home.viewOffer}
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
  )
}