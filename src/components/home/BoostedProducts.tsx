'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, Heart, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  // WICHTIG: Immer 2 Dezimalstellen anzeigen, damit Preise wie CHF 1.80 korrekt angezeigt werden
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      minute: '2-digit',
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
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            {isSuperBoost ? t.home.superBoostOffers : t.home.turboBoostFeatures}
          </h2>
          <p className="text-sm text-gray-600">
            {isSuperBoost ? t.home.premiumOffersDesc : t.home.highlightOffersDesc}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map(product => {
            return (
              <div
                key={product.id}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="relative aspect-[5/4]">
                  {product.images && product.images.length > 0 ? (
                    product.images[0].startsWith('data:') ||
                    product.images[0].startsWith('blob:') ||
                    product.images[0].includes('blob.vercel-storage.com') ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 16vw"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Sparkles className="mb-2 h-6 w-6 text-gray-400 opacity-50" />
                      <span className="text-xs text-gray-400">{t.home.noImage}</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute right-1.5 top-1.5 rounded-full p-1 transition-colors ${
                      favorites.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className="h-3 w-3" />
                  </button>
                  {isSuperBoost && (
                    <div className="absolute left-1.5 top-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1 text-white shadow-md">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                  {!isSuperBoost && (
                    <div className="absolute left-1.5 top-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 text-white shadow-md">
                      <Zap className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <div className="p-2">
                  {product.brand && (
                    <div className="mb-1 truncate text-xs font-medium text-primary-600">
                      {product.brand}
                    </div>
                  )}
                  <div className="mb-1 line-clamp-2 min-h-[40px] text-sm font-medium leading-tight text-gray-900">
                    {product.title}
                  </div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    {product.buyNowPrice && (
                      <div className="text-xs text-gray-500">
                        Sofort: {formatPrice(product.buyNowPrice)}
                      </div>
                    )}
                  </div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
                      {product.condition}
                    </span>
                    {(product.city || product.postalCode) && (
                      <span className="flex items-center gap-0.5 truncate">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {product.postalCode && product.city
                          ? `${product.postalCode} ${product.city}`
                          : product.postalCode || product.city}
                      </span>
                    )}
                  </div>
                  {product.isAuction && product.auctionEnd && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeLeft(product.auctionEnd)}</span>
                    </div>
                  )}
                  <Link
                    href={`/search?q=${encodeURIComponent(`${product.brand} ${product.model}`)}`}
                    className="block w-full rounded bg-primary-600 px-2 py-1 text-center text-xs text-white transition-colors hover:bg-primary-700"
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
