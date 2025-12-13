'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Eye, Heart, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProductStats {
  watchId: string
  favoriteCount: number
  viewCount: number
  soldLast24h: number
  viewersNow: number
  lastUpdated: string
}

interface SocialProofWidgetProps {
  watchIds: string[]
  className?: string
}

/**
 * Social Proof Widget (Feature 2)
 *
 * Zeigt Social Proof Informationen für Produkte:
 * - Anzahl Favoriten
 * - Anzahl Views
 * - Verkäufe in den letzten 24 Stunden
 * - Aktuelle Viewer
 */
export function SocialProofWidget({ watchIds, className = '' }: SocialProofWidgetProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<ProductStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (watchIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/products/stats?watchIds=${watchIds.join(',')}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || [])
        }
      } catch (error) {
        console.error('Error fetching social proof stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [watchIds.join(',')])

  if (loading || stats.length === 0) {
    return null
  }

  // Berechne aggregierte Statistiken
  const totalFavorites = stats.reduce((sum, stat) => sum + stat.favoriteCount, 0)
  const totalViews = stats.reduce((sum, stat) => sum + stat.viewCount, 0)
  const totalSold = stats.reduce((sum, stat) => sum + stat.soldLast24h, 0)
  const totalViewers = stats.reduce((sum, stat) => sum + stat.viewersNow, 0)

  // Zeige Widget nur wenn es relevante Daten gibt
  if (totalFavorites === 0 && totalViews === 0 && totalSold === 0 && totalViewers === 0) {
    return null
  }

  return (
    <section className={`bg-gradient-to-br from-primary-50 to-primary-100 py-8 ${className}`}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Vertrauen Sie unserer Community</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tausende von Nutzern vertrauen auf unsere Plattform
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Favoriten */}
          {totalFavorites > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-full bg-red-100 p-2">
                  <Heart className="h-5 w-5 text-red-600" fill="currentColor" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalFavorites.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {totalFavorites === 1 ? 'Favorit' : 'Favoriten'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Views */}
          {totalViews > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-full bg-blue-100 p-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {totalViews === 1 ? 'Aufruf' : 'Aufrufe'} (30 Tage)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verkäufe letzte 24h */}
          {totalSold > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-full bg-green-100 p-2">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalSold.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {totalSold === 1 ? 'Verkauf' : 'Verkäufe'} (24h)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aktuelle Viewer */}
          {totalViewers > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-full bg-purple-100 p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalViewers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {totalViewers === 1 ? 'Person' : 'Personen'} gerade aktiv
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zusätzliche Social Proof Nachricht */}
        {totalSold > 0 && (
          <div className="mt-6 rounded-lg bg-white/80 p-4 text-center shadow-sm">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-primary-600">
                {totalSold} {totalSold === 1 ? 'Artikel wurde' : 'Artikel wurden'}
              </span>{' '}
              in den letzten 24 Stunden verkauft
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
