'use client'

import { BadgeInfo } from '@/lib/badge-system'
import { Award } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BadgeDisplayProps {
  userId?: string
  className?: string
  showTitle?: boolean
  limit?: number
}

/**
 * Badge Display Komponente (Feature 9: Gamification)
 *
 * Zeigt User-Badges in verschiedenen Kontexten
 */
export function BadgeDisplay({
  userId,
  className = '',
  showTitle = true,
  limit,
}: BadgeDisplayProps) {
  const [badges, setBadges] = useState<Array<BadgeInfo & { earnedAt: Date }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchBadges = async () => {
      try {
        const response = await fetch('/api/user/badges')
        if (response.ok) {
          const data = await response.json()
          const badgesList = data.badges || []
          setBadges(limit ? badgesList.slice(0, limit) : badgesList)
        }
      } catch (error) {
        console.error('Error fetching badges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId, limit])

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="text-sm text-gray-600">Lade Badges...</span>
        </div>
      </div>
    )
  }

  if (badges.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Badges</h3>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {badges.map((badge, index) => (
          <div
            key={index}
            className="group relative flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md"
            title={`${badge.name}: ${badge.description} - Erreicht am ${new Date(
              badge.earnedAt
            ).toLocaleDateString('de-CH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${badge.color} text-xl`}
            >
              {badge.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{badge.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(badge.earnedAt).toLocaleDateString('de-CH', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
