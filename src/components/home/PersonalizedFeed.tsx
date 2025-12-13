'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Watch {
  id: string
  title: string
  brand: string | null
  price: number
  images: string[]
  createdAt: string
}

interface PersonalizedFeedProps {
  className?: string
}

/**
 * Personalisierter Feed (Feature 5: Personalisierung)
 *
 * Zeigt personalisierte Produkt-Empfehlungen basierend auf:
 * - Browsing-Historie
 * - User-Präferenzen
 * - Ähnliche Käufer
 */
export function PersonalizedFeed({ className = '' }: PersonalizedFeedProps) {
  const { t } = useLanguage()
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string>('popular')

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations?limit=8')
        if (response.ok) {
          const data = await response.json()
          setWatches(data.watches || [])
          setReason(data.reason || 'popular')
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-pink-50 py-16 ${className}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (watches.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {reason === 'personalized' ? 'Für Sie empfohlen' : 'Beliebte Produkte'}
              </h2>
              <p className="text-sm text-gray-600">
                {reason === 'personalized'
                  ? 'Basierend auf Ihren Interessen und Präferenzen'
                  : 'Die beliebtesten Produkte auf Helvenda'}
              </p>
            </div>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            Alle anzeigen →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {watches.map(watch => {
            const images =
              typeof watch.images === 'string' ? JSON.parse(watch.images) : watch.images
            const firstImage =
              Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder-watch.jpg'

            return (
              <Link
                key={watch.id}
                href={`/watches/${watch.id}`}
                className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                  <Image
                    src={firstImage}
                    alt={watch.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                    {watch.title}
                  </h3>
                  {watch.brand && <p className="mb-2 text-xs text-gray-500">{watch.brand}</p>}
                  <p className="text-lg font-bold text-primary-600">
                    CHF {watch.price.toLocaleString('de-CH')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
