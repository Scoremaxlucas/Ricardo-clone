'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Clock, Eye } from 'lucide-react'

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
}

export function FeaturedProducts() {
  const [favorites, setFavorites] = useState<string[]>([])
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

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getTimeLeft = (auctionEnd?: string) => {
    if (!auctionEnd) return null
    const end = new Date(auctionEnd)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Beendet'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Uhren...</p>
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
              Empfohlene Uhren
            </h2>
            <p className="text-lg text-gray-600">
              Noch keine Uhren verfügbar. Seien Sie der Erste, der eine Uhr anbietet!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Empfohlene Uhren
          </h2>
          <p className="text-lg text-gray-600">
            Entdecken Sie die beliebtesten und neuesten Uhren-Angebote
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watches.map((product) => {
            const boosters = product.boosters || []
            const hasBoost = boosters.includes('boost')
            const hasTurboBoost = boosters.includes('turbo-boost')
            const hasSuperBoost = boosters.includes('super-boost')
            
            return (
              <div 
                key={product.id} 
                className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${
                  hasSuperBoost 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400' 
                    : hasTurboBoost
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400'
                    : hasBoost
                    ? 'bg-white border-2 border-primary-400'
                    : 'bg-white'
                }`}
              >
                <div className="relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Kein Bild</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                      favorites.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                  {hasSuperBoost && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      ⭐ SUPER-BOOST
                    </div>
                  )}
                  {hasTurboBoost && !hasSuperBoost && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🚀 TURBO-BOOST
                    </div>
                  )}
                  {!hasSuperBoost && !hasTurboBoost && product.isAuction && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      Auktion
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${hasBoost || hasTurboBoost || hasSuperBoost ? 'font-bold' : ''} ${hasSuperBoost ? 'text-orange-600' : hasTurboBoost ? 'text-purple-600' : hasBoost ? 'text-primary-600' : 'text-primary-600'}`}>
                      {product.brand}
                    </span>
                    <span className="text-sm text-gray-500">{product.year}</span>
                  </div>
                  
                  <h3 className={`text-lg mb-2 line-clamp-2 ${hasBoost || hasTurboBoost || hasSuperBoost ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                    {product.title}
                  </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.buyNowPrice && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Sofortkauf: {formatPrice(product.buyNowPrice)})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {product.condition}
                  </span>
                </div>

                {product.isAuction && product.auctionEnd && (
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {getTimeLeft(product.auctionEnd)}
                    </div>
                  </div>
                )}

                <Link
                  href={`/search?q=${encodeURIComponent(`${product.brand} ${product.model}`)}`}
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Angebot ansehen
                </Link>
              </div>
            </div>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/products"
            className="inline-flex items-center bg-white text-primary-600 hover:text-primary-700 font-medium px-6 py-3 rounded-lg border border-primary-300 hover:border-primary-400 transition-colors"
          >
            Alle Uhren anzeigen
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}