'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Heart, Package } from 'lucide-react'

interface Product {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  condition: string
  isAuction: boolean
  currentBid?: number
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/favorites')
      return
    }

    if (status === 'authenticated') {
      fetchFavorites()
    }
  }, [status, router])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        const favoriteItems = data.favorites || []
        
        // Hole Details für jeden Favoriten
        const productPromises = favoriteItems.map(async (fav: any) => {
          try {
            const res = await fetch(`/api/watches/${fav.watchId}`)
            if (res.ok) {
              const data = await res.json()
              const watch = data.watch || data // API kann { watch: {...} } oder direkt {...} zurückgeben
              
              // Parse images falls sie als String kommen
              if (watch && typeof watch.images === 'string') {
                try {
                  watch.images = JSON.parse(watch.images)
                } catch (e) {
                  watch.images = []
                }
              }
              
              // Stelle sicher, dass price existiert
              if (watch && !watch.price) {
                watch.price = 0
              }
              
              return watch
            }
          } catch (e) {
            console.error('Error fetching watch:', e)
          }
          return null
        })

        const products = await Promise.all(productPromises)
        setFavorites(products.filter(p => p !== null && p.price !== undefined))
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (productId: string) => {
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setFavorites(prev => prev.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Favoriten...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Startseite
          </Link>
          <span className="mx-2">›</span>
          <span>Meine Favoriten</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">
              Meine Favoriten
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'Artikel' : 'Artikel'}
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Noch keine Favoriten
            </h2>
            <p className="text-gray-600 mb-6">
              Fügen Sie Artikel zu Ihren Favoriten hinzu, um sie später schnell wiederzufinden.
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Artikel durchstöbern
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/products/${product.id}`}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    {product.brand && (
                      <div className="text-sm text-primary-600 mb-1">{product.brand}</div>
                    )}
                    <div className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-primary-600">
                      {product.title}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-bold text-gray-900">
                      CHF {product.isAuction && product.currentBid
                        ? product.currentBid.toFixed(2)
                        : (product.price || 0).toFixed(2)}
                    </div>
                    {product.isAuction && (
                      <div className="text-xs text-gray-500">Gebot</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    >
                      Ansehen
                    </Link>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Aus Favoriten entfernen"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

