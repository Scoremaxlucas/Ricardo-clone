'use client'

import { Eye, Heart, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProductStatsProps {
  watchId: string
  className?: string
  showViewersNow?: boolean
  showSoldLast24h?: boolean
  compact?: boolean
}

interface Stats {
  viewCount: number
  favoriteCount: number
  soldLast24h: number
  similarSoldLast24h: number
  viewersNow: number
}

/**
 * ProductStats Komponente (Feature 2: Social Proof)
 *
 * Zeigt Vertrauenssignale für ein Produkt:
 * - Anzahl der Aufrufe
 * - Anzahl der Favoriten
 * - "X verkauft in letzten 24h" (für ähnliche Produkte)
 * - "Y Personen schauen gerade" (Live-Counter)
 */
export function ProductStats({
  watchId,
  className = '',
  showViewersNow = true,
  showSoldLast24h = true,
  compact = false,
}: ProductStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/products/${watchId}/stats`, {
          signal: abortController.signal,
        })
        if (response.ok && isMounted) {
          const data = await response.json()
          setStats({
            viewCount: data.viewCount || 0,
            favoriteCount: data.favoriteCount || 0,
            soldLast24h: data.soldLast24h || 0,
            similarSoldLast24h: data.similarSoldLast24h || 0,
            viewersNow: data.viewersNow || 0,
          })
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Error fetching product stats:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    // Track viewer (nur einmal beim Mount)
    if (showViewersNow) {
      fetch(`/api/products/${watchId}/viewers`, { method: 'POST' }).catch(err => {
        if (isMounted) {
          console.error('[ProductStats] Error tracking viewer:', err)
        }
      })
    }

    // Polling für Live-Viewer (alle 30 Sekunden)
    const interval = setInterval(() => {
      if (isMounted && showViewersNow) {
        fetchStats()
        // Re-track viewer alle 2 Minuten
        fetch(`/api/products/${watchId}/viewers`, { method: 'POST' }).catch(err => {
          if (isMounted) {
            console.error('[ProductStats] Error re-tracking viewer:', err)
          }
        })
      }
    }, 30000)

    return () => {
      isMounted = false
      abortController.abort()
      clearInterval(interval)
    }
  }, [watchId, showViewersNow])

  if (loading || !stats) {
    return null // Silent loading - don't show skeleton
  }

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-3 text-xs text-gray-600 ${className}`}>
        {stats.viewCount > 0 && (
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{formatNumber(stats.viewCount)}</span>
          </div>
        )}
        {stats.favoriteCount > 0 && (
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{formatNumber(stats.favoriteCount)}</span>
          </div>
        )}
        {showViewersNow && stats.viewersNow > 0 && (
          <div className="flex items-center gap-1 text-primary-600">
            <Users className="h-3 w-3" />
            <span>{stats.viewersNow} schauen gerade</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm ${className}`}>
      {/* View Count */}
      {stats.viewCount > 0 && (
        <div className="flex items-center gap-2 text-gray-600">
          <Eye className="h-4 w-4" />
          <span>{formatNumber(stats.viewCount)} Aufrufe</span>
        </div>
      )}

      {/* Favorite Count */}
      {stats.favoriteCount > 0 && (
        <div className="flex items-center gap-2 text-gray-600">
          <Heart className="h-4 w-4" />
          <span>{formatNumber(stats.favoriteCount)} Favoriten</span>
        </div>
      )}

      {/* Sold Last 24h (für ähnliche Produkte) */}
      {showSoldLast24h && stats.similarSoldLast24h > 0 && (
        <div className="flex items-center gap-2 font-medium text-green-600">
          <ShoppingBag className="h-4 w-4" />
          <span>{stats.similarSoldLast24h} ähnliche Artikel verkauft in 24h</span>
        </div>
      )}

      {/* Live Viewers */}
      {showViewersNow && stats.viewersNow > 0 && (
        <div className="flex animate-pulse items-center gap-2 font-medium text-primary-600">
          <Users className="h-4 w-4" />
          <span>
            {stats.viewersNow} {stats.viewersNow === 1 ? 'Person schaut' : 'Personen schauen'}{' '}
            gerade
          </span>
        </div>
      )}
    </div>
  )
}
