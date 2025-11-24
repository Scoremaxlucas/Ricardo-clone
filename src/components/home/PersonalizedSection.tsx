'use client'

import { useState, useEffect } from 'react'
import { ModernProductCard } from '@/components/ui/ModernProductCard'
import { useSession } from 'next-auth/react'

interface PersonalizedSectionProps {
  title: string
  subtitle?: string
  apiEndpoint: string
  horizontal?: boolean
}

export function PersonalizedSection({
  title,
  subtitle,
  apiEndpoint,
  horizontal = false
}: PersonalizedSectionProps) {
  const { data: session } = useSession()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const url = session?.user 
          ? `${apiEndpoint}?userId=${session.user.id}`
          : apiEndpoint
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.watches?.slice(0, horizontal ? 10 : 5) || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [apiEndpoint, session?.user])

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
      <section className="py-12 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#F4F4F4] rounded w-64 mb-6"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-64 bg-[#F4F4F4] rounded-[16px]"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#3A3A3A] mb-2">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[#C6C6C6]">{subtitle}</p>
          )}
        </div>

        {horizontal ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[260px]">
                <ModernProductCard
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ModernProductCard
                key={product.id}
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
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}














