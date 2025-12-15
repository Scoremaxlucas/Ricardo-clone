'use client'

import { ProductCard } from '@/components/ui/ProductCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { Sparkles, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'

interface Product {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
  isAuction: boolean
  currentBid?: number
  condition?: string
  city?: string
  postalCode?: string
  auctionEnd?: string
  buyNowPrice?: number
  bids?: any[]
  createdAt?: string
}

export function SmartDiscoveryHub() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    const fetchPersonalizedProducts = async () => {
      setLoading(true)
      try {
        // Hole personalisierte Empfehlungen
        const url = session?.user
          ? `/api/watches/recommended?userId=${(session.user as { id?: string })?.id}`
          : '/api/watches?limit=8&sort=popular'

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.watches?.slice(0, 12) || data.slice(0, 12) || [])
        }
      } catch (error) {
        console.error('Error fetching personalized products:', error)
        // Fallback zu normalen Produkten
        const fallback = await fetch('/api/watches?limit=8')
        if (fallback.ok) {
          const data = await fallback.json()
          setProducts(data.watches?.slice(0, 8) || [])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPersonalizedProducts()
  }, [(session?.user as { id?: string })?.id])

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
      setIsLoginModalOpen(true)
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
      <section className="bg-primary-50 py-8">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-600">Lade...</p>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-purple-50 py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary-600 p-2 shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {session?.user ? 'Für Sie empfohlen' : 'Beliebte Artikel'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-600">
                {session?.user ? 'Basierend auf Ihren Interessen' : 'Die beliebtesten Artikel'}
              </p>
            </div>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 md:flex"
          >
            Alle anzeigen
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid - Kompakter, mehr Spalten */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {products.map(product => (
            <ProductCard
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
      </div>
    </section>
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Anmeldung erforderlich"
        message="Bitte melden Sie sich an, um Favoriten hinzuzufügen."
        loginButtonText="Anmelden"
      />
  )
}
