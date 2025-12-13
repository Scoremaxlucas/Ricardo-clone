'use client'

import { RewardType } from '@/lib/reward-system'
import { Crown, Gift, Tag, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Reward {
  id: string
  rewardType: RewardType
  rewardValue: {
    percent?: number
    boosterCode?: string
    feature?: string
  }
  expiresAt: Date
  claimedAt: Date | null
  usedAt: Date | null
}

interface RewardDisplayProps {
  userId?: string
  className?: string
  showTitle?: boolean
  limit?: number
}

/**
 * Reward Display Komponente (Feature 9: Gamification)
 *
 * Zeigt User-Rewards in verschiedenen Kontexten
 */
export function RewardDisplay({
  userId,
  className = '',
  showTitle = true,
  limit,
}: RewardDisplayProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/user/rewards')
        if (response.ok) {
          const data = await response.json()
          const rewardsList = data.rewards || []
          setRewards(limit ? rewardsList.slice(0, limit) : rewardsList)
        }
      } catch (error) {
        console.error('Error fetching rewards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRewards()
  }, [userId, limit])

  const getRewardIcon = (rewardType: RewardType) => {
    switch (rewardType) {
      case 'discount':
        return <Tag className="h-5 w-5" />
      case 'free_booster':
        return <Zap className="h-5 w-5" />
      case 'premium_feature':
        return <Crown className="h-5 w-5" />
      default:
        return <Gift className="h-5 w-5" />
    }
  }

  const getRewardColor = (rewardType: RewardType) => {
    switch (rewardType) {
      case 'discount':
        return 'bg-green-500'
      case 'free_booster':
        return 'bg-blue-500'
      case 'premium_feature':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatRewardValue = (reward: Reward): string => {
    switch (reward.rewardType) {
      case 'discount':
        return `${reward.rewardValue.percent}% Rabatt`
      case 'free_booster':
        return 'Kostenloser Booster'
      case 'premium_feature':
        return reward.rewardValue.feature === 'monthly_free_booster'
          ? 'Monatlicher kostenloser Booster'
          : 'Premium Feature'
      default:
        return 'Belohnung'
    }
  }

  const isExpired = (expiresAt: Date): boolean => {
    return new Date(expiresAt) < new Date()
  }

  const formatExpiresAt = (expiresAt: Date): string => {
    const date = new Date(expiresAt)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'Abgelaufen'
    } else if (diffDays === 0) {
      return 'Läuft heute ab'
    } else if (diffDays === 1) {
      return 'Läuft morgen ab'
    } else if (diffDays <= 7) {
      return `Läuft in ${diffDays} Tagen ab`
    } else {
      return date.toLocaleDateString('de-CH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="text-sm text-gray-600">Lade Belohnungen...</span>
        </div>
      </div>
    )
  }

  if (rewards.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Belohnungen</h3>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map(reward => {
          const expired = isExpired(reward.expiresAt)
          const used = reward.usedAt !== null

          return (
            <div
              key={reward.id}
              className={`group relative flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                expired || used ? 'opacity-60' : ''
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getRewardColor(
                  reward.rewardType
                )} text-white`}
              >
                {getRewardIcon(reward.rewardType)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{formatRewardValue(reward)}</p>
                <p className="mt-1 text-xs text-gray-500">{formatExpiresAt(reward.expiresAt)}</p>
                {used && <p className="mt-1 text-xs font-medium text-green-600">Verwendet</p>}
                {expired && !used && (
                  <p className="mt-1 text-xs font-medium text-red-600">Abgelaufen</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
