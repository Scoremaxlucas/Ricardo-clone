'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Clock, Sparkles, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

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

interface BoostedProductsProps {
  boosterType: 'turbo-boost' | 'super-boost'
}

export function BoostedProducts({ boosterType }: BoostedProductsProps) {
  const { t } = useLanguage()
  const [favorites, setFavorites] = useState<string[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`/api/watches/boosted?type=${boosterType}&limit=6`)
        if (response.ok) {
          const data = await response.json()
          setItems(Array.isArray(data.watches) ? data.watches : []) // API verwendet noch 'watches'
        } else {
          console.error('API response not ok:', response.status)
          setItems([])
        }
      } catch (error) {
        console.error('Error fetching boosted items:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
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

  const getTimeLeft = (auctionEnd?: string) => {
    if (!auctionEnd) return null
    const end = new Date(auctionEnd)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return t.home.ended
    
    // Zeige genaues Datum und Uhrzeit
    return `${t.home.ended}: ${end.toLocaleString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  }

  if (loading) {
    return null
  }

  if (items.length === 0) {
    return null
  }

  const isSuperBoost = boosterType === 'super-boost'

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isSuperBoost ? t.home.superBoostOffers : t.home.turboBoostFeatures}
          </h2>
          <p className="text-sm text-gray-600">
            {isSuperBoost 
              ? t.home.premiumOffersDesc
              : t.home.highlightOffersDesc
            }
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((product) => {
            return (
              <div 
                key={product.id} 
                className="rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white border border-gray-200"
              >
                <div className="relative aspect-[5/4]">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">{t.home.noImage}</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-colors ${
                      favorites.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className="h-3 w-3" />
                  </button>
                  {isSuperBoost && (
                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md flex items-center justify-center">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                  {!isSuperBoost && (
                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md flex items-center justify-center">
                      <Zap className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <div className="p-2">
                  {product.brand && (
                    <div className="text-xs font-medium text-primary-600 mb-1 truncate">
                      {product.brand}
                    </div>
                  )}
                  <div className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 min-h-[40px] leading-tight">
                    {product.title}
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    {product.buyNowPrice && (
                      <div className="text-xs text-gray-500">
                        Sofort: {formatPrice(product.buyNowPrice)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <span className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs">
                      {product.condition}
                    </span>
                    {(product.city || product.postalCode) && (
                      <span className="flex items-center gap-0.5 truncate">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {product.city && product.postalCode 
                          ? `${product.city} ${product.postalCode}`
                          : product.city || product.postalCode}
                      </span>
                    )}
                  </div>
                  {product.isAuction && product.auctionEnd && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mb-1">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeLeft(product.auctionEnd)}</span>
                    </div>
                  )}
                  <Link
                    href={`/search?q=${encodeURIComponent(`${product.brand} ${product.model}`)}`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-1 px-2 rounded text-xs transition-colors"
                  >
                    {t.home.viewOffer}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
