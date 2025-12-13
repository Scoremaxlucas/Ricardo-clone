'use client'

import { BADGE_INFO, BadgeType } from '@/lib/badge-system'
import { Award } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BadgeProgress {
  badgeType: BadgeType
  current: number
  target: number
  progress: number
  nextMilestone?: string
}

interface BadgeProgressProps {
  className?: string
  showTitle?: boolean
}

/**
 * BadgeProgress Komponente (Feature 9: Gamification)
 *
 * Zeigt Progress-Bars für alle noch nicht erreichten Badges
 */
export function BadgeProgress({ className = '', showTitle = true }: BadgeProgressProps) {
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/user/badge-progress')
        if (response.ok) {
          const data = await response.json()
          setProgress(data.progress || [])
        }
      } catch (error) {
        console.error('Error fetching badge progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="text-sm text-gray-600">Lade Fortschritt...</span>
        </div>
      </div>
    )
  }

  if (progress.length === 0) {
    return null
  }

  // Gruppiere nach Kategorie
  const buyerBadges = progress.filter(b =>
    ['FIRST_PURCHASE', 'POWER_BUYER_10', 'POWER_BUYER_50'].includes(b.badgeType)
  )
  const sellerBadges = progress.filter(b => b.badgeType === 'POWER_SELLER')
  const streakBadges = progress.filter(b => ['STREAK_7', 'STREAK_30'].includes(b.badgeType))
  const loyaltyBadges = progress.filter(b => b.badgeType === 'LOYAL_CUSTOMER')

  const renderProgressBar = (item: BadgeProgress) => {
    const badgeInfo = BADGE_INFO[item.badgeType]
    if (!badgeInfo) return null

    return (
      <div key={item.badgeType} className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${badgeInfo.color} text-xl text-white`}
          >
            {badgeInfo.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{badgeInfo.name}</h4>
            <p className="text-xs text-gray-500">{badgeInfo.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {item.current} / {item.target}
            </div>
            <div className="text-xs text-gray-500">{Math.round(item.progress)}%</div>
          </div>
        </div>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all ${badgeInfo.color}`}
            style={{ width: `${Math.min(item.progress, 100)}%` }}
          />
        </div>
        {item.nextMilestone && (
          <p className="text-xs font-medium text-primary-600">{item.nextMilestone}</p>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Nächste Badges</h3>
        </div>
      )}

      <div className="space-y-4">
        {buyerBadges.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Käufer-Badges</h4>
            <div className="space-y-2">{buyerBadges.map(renderProgressBar)}</div>
          </div>
        )}

        {sellerBadges.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Verkäufer-Badges</h4>
            <div className="space-y-2">{sellerBadges.map(renderProgressBar)}</div>
          </div>
        )}

        {streakBadges.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Streak-Badges</h4>
            <div className="space-y-2">{streakBadges.map(renderProgressBar)}</div>
          </div>
        )}

        {loyaltyBadges.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Loyalitäts-Badges</h4>
            <div className="space-y-2">{loyaltyBadges.map(renderProgressBar)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
