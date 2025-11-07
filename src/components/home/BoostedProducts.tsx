'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Sparkles } from 'lucide-react'

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

interface BoostedProductsProps {
  boosterType: 'turbo-boost' | 'super-boost'
}

export function BoostedProducts({ boosterType }: BoostedProductsProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        const response = await fetch('/api/watches/search?limit=3')
        if (response.ok) {
          const data = await response.json()
          // Filter nach Booster-Type
          const filtered = Array.isArray(data.watches) 
            ? data.watches.filter((w: Watch) => w.boosters?.includes(boosterType))
            : []
          setWatches(filtered)
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
  }, [boosterType])

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

  if (loading) {
    return null // Zeige nichts während des Ladens für bessere UX
  }

  if (watches.length === 0) {
    return null // Zeige nichts wenn keine Boosters vorhanden
  }

  const isSuperBoost = boosterType === 'super-boost'

  return (
    <section className={`py-16 ${isSuperBoost ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className={`h-8 w-8 ${isSuperBoost ? 'text-orange-600' : 'text-purple-600'}`} />
            <h2 className={`text-3xl font-bold ${isSuperBoost ? 'text-orange-900' : 'text-purple-900'}`}>
              {isSuperBoost ? '⭐ Super-Boost Angebote' : '🚀 Turbo-Boost Features'}
            </h2>
            <Sparkles className={`h-8 w-8 ${isSuperBoost ? 'text-orange-600' : 'text-purple-600'}`} />
          </div>
          <p className={`text-lg ${isSuperBoost ? 'text-orange-700' : 'text-purple-700'}`}>
            {isSuperBoost 
              ? 'Unsere Premium-Angebote - Die besten Uhren am Markt' 
              : 'Highlight-Angebote - Sehen Sie was gerade angesagt ist'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {watches.map((product) => (
            <div 
              key={product.id} 
              className={`rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                isSuperBoost
                  ? 'bg-white border-2 border-yellow-400 hover:border-orange-500 transform hover:scale-105'
                  : 'bg-white border-2 border-blue-400 hover:border-purple-500 transform hover:scale-105'
              }`}
            >
              <div className="relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
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
                {isSuperBoost && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-xl animate-pulse">
                    ⭐⭐ SUPER-BOOST ⭐⭐
                  </div>
                )}
                {!isSuperBoost && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-full text-sm font-bold shadow-xl">
                    🚀🚀 TURBO-BOOST 🚀🚀
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold ${isSuperBoost ? 'text-orange-600' : 'text-purple-600'}`}>
                    {product.brand}
                  </span>
                  <span className="text-sm text-gray-500">{product.year}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {product.title}
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={`text-3xl font-bold ${isSuperBoost ? 'text-orange-600' : 'text-purple-600'}`}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded">
                    {product.condition}
                  </span>
                </div>

                <Link
                  href={`/watches/${product.id}`}
                  className={`block w-full text-center py-3 px-4 rounded-lg transition-colors font-bold ${
                    isSuperBoost
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  }`}
                >
                  Jetzt kaufen
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}



