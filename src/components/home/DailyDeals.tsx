'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DailyDeal {
  id: string
  watchId: string
  discountPercent: number
  originalPrice: number
  discountPrice: number
  endDate: string
  remainingQuantity: number
  watch: {
    id: string
    title: string
    brand: string | null
    images: string[]
  }
}

interface DailyDealsProps {
  className?: string
}

/**
 * Daily Deals Komponente (Feature 9: Gamification)
 *
 * Zeigt zeitlich begrenzte Angebote mit Countdown-Timer
 */
export function DailyDeals({ className = '' }: DailyDealsProps) {
  const { t } = useLanguage()
  const [deals, setDeals] = useState<DailyDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/daily-deals')
        if (response.ok) {
          const data = await response.json()
          setDeals(data.deals || [])
        }
      } catch (error) {
        console.error('Error fetching daily deals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [])

  // Update countdown every second
  useEffect(() => {
    if (deals.length === 0) return

    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {}

      deals.forEach(deal => {
        const now = new Date().getTime()
        const end = new Date(deal.endDate).getTime()
        const diff = end - now

        if (diff <= 0) {
          newTimeRemaining[deal.id] = 'Abgelaufen'
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)

          newTimeRemaining[deal.id] = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      })

      setTimeRemaining(newTimeRemaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [deals])

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-orange-50 to-red-50 py-16 ${className}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (deals.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-red-50 py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-red-600">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deals des Tages</h2>
              <p className="text-sm text-gray-600">Zeitlich begrenzte Angebote - Nur heute!</p>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map(deal => {
            const images =
              typeof deal.watch.images === 'string'
                ? JSON.parse(deal.watch.images)
                : deal.watch.images
            const firstImage =
              Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder-watch.jpg'
            const timeLeft = timeRemaining[deal.id] || '00:00:00'

            return (
              <Link
                key={deal.id}
                href={`/watches/${deal.watchId}`}
                className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl"
              >
                {/* Discount Badge */}
                <div className="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
                  -{deal.discountPercent}%
                </div>

                {/* Countdown Badge */}
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  <Clock className="h-3 w-3" />
                  {timeLeft}
                </div>

                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                  <Image
                    src={firstImage}
                    alt={deal.watch.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                    {deal.watch.title}
                  </h3>
                  {deal.watch.brand && (
                    <p className="mb-2 text-xs text-gray-500">{deal.watch.brand}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-red-600">
                      CHF {deal.discountPrice.toLocaleString('de-CH', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-gray-400 line-through">
                      CHF {deal.originalPrice.toLocaleString('de-CH', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  {deal.remainingQuantity > 0 && deal.remainingQuantity <= 5 && (
                    <p className="mt-2 text-xs text-orange-600">
                      Nur noch {deal.remainingQuantity} verfügbar!
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
