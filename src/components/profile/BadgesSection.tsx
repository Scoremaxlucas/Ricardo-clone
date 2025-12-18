'use client'

import { BadgeDisplay } from '@/components/user/BadgeDisplay'
import { BadgeProgress } from '@/components/user/BadgeProgress'
import { BADGE_INFO, BadgeType } from '@/lib/badge-system'
import { Award, CheckCircle, Flame, ShoppingBag, Store, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BadgeProgress {
  badgeType: BadgeType
  current: number
  target: number
  progress: number
  nextMilestone?: string
}

interface BadgeInfo {
  type: BadgeType
  name: string
  description: string
  icon: string
  color: string
  earnedAt?: Date
}

interface BadgesSectionProps {
  userId: string
}

type BadgeTab = 'buyer' | 'seller' | 'streak' | 'loyalty'

export function BadgesSection({ userId }: BadgesSectionProps) {
  const [activeTab, setActiveTab] = useState<BadgeTab>('buyer')
  const [earnedBadges, setEarnedBadges] = useState<Array<BadgeInfo & { earnedAt: Date }>>([])
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [loyaltyDays, setLoyaltyDays] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [badgesRes, progressRes, userRes] = await Promise.all([
          fetch('/api/user/badges'),
          fetch('/api/user/badge-progress'),
          fetch(`/api/users/${userId}/stats`),
        ])

        if (badgesRes.ok) {
          const badgesData = await badgesRes.json()
          const badgesList = badgesData.badges || []
          // Convert earnedAt strings to Date objects
          setEarnedBadges(
            badgesList.map((badge: any) => ({
              ...badge,
              earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : undefined,
            }))
          )
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setProgress(progressData.progress || [])
        }

        // Calculate loyalty days from user stats
        if (userRes.ok) {
          const userData = await userRes.json()
          // Check both user.createdAt and stats.createdAt
          const createdAt = userData.user?.createdAt || userData.stats?.createdAt
          if (createdAt) {
            const createdAtDate = new Date(createdAt)
            const daysSinceJoin = Math.floor(
              (new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            setLoyaltyDays(daysSinceJoin)
          }
        }
      } catch (error) {
        console.error('Error fetching badge data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Gruppiere Badges nach Kategorie
  const buyerBadges = {
    earned: earnedBadges.filter(b =>
      ['FIRST_PURCHASE', 'POWER_BUYER_10', 'POWER_BUYER_50'].includes(b.type)
    ),
    progress: progress.filter(b =>
      ['FIRST_PURCHASE', 'POWER_BUYER_10', 'POWER_BUYER_50'].includes(b.badgeType)
    ),
  }

  const sellerBadges = {
    earned: earnedBadges.filter(b => b.type === 'POWER_SELLER'),
    progress: progress.filter(b => b.badgeType === 'POWER_SELLER'),
  }

  const streakBadges = {
    earned: earnedBadges.filter(b => ['STREAK_7', 'STREAK_30'].includes(b.type)),
    progress: progress.filter(b => ['STREAK_7', 'STREAK_30'].includes(b.badgeType)),
  }

  const loyaltyBadges = {
    earned: earnedBadges.filter(b => b.type === 'LOYAL_CUSTOMER'),
    progress: progress.filter(b => b.badgeType === 'LOYAL_CUSTOMER'),
  }

  // Berechne Stats
  const totalBadges = earnedBadges.length
  const activeStreak = streakBadges.earned.length > 0 ? streakBadges.earned.length : 0
  const loyaltyDisplay = loyaltyDays !== null ? Math.floor(loyaltyDays / 365) : null

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'buyer':
        return buyerBadges
      case 'seller':
        return sellerBadges
      case 'streak':
        return streakBadges
      case 'loyalty':
        return loyaltyBadges
    }
  }

  const renderBadgeItem = (badge: BadgeInfo & { earnedAt?: Date }, isEarned: boolean) => {
    return (
      <div
        key={badge.name}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
      >
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${badge.color} text-xl`}>
          {badge.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{badge.name}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{badge.description}</p>
        </div>
        {isEarned && badge.earnedAt && (
          <div className="flex-shrink-0 text-right">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(badge.earnedAt).toLocaleDateString('de-CH', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderProgressItem = (item: BadgeProgress) => {
    const badgeInfo = BADGE_INFO[item.badgeType]
    if (!badgeInfo) return null

    return (
      <div
        key={item.badgeType}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
      >
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${badgeInfo.color} text-xl text-white`}
        >
          {badgeInfo.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{badgeInfo.name}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{badgeInfo.description}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all ${badgeInfo.color}`}
              style={{ width: `${Math.min(item.progress, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">
            {item.current} / {item.target}
          </p>
          <p className="text-xs text-gray-500">{Math.round(item.progress)}%</p>
        </div>
      </div>
    )
  }

  const currentData = getCurrentTabData()
  const displayItems = showAll
    ? [...currentData.earned, ...currentData.progress]
    : [...currentData.earned.slice(0, 3), ...currentData.progress.slice(0, 3)]

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <span className="text-sm text-gray-600">Lade Badges...</span>
      </div>
    )
  }

  const hasAnyBadges = totalBadges > 0 || progress.length > 0
  if (!hasAnyBadges) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Badges Overview Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-600">Aktive Badges</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{totalBadges}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-600">Streak</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{activeStreak}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-600">Loyalität</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {loyaltyDisplay !== null && loyaltyDisplay > 0 ? `${loyaltyDisplay}J` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-600">Fortschritt</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{progress.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setActiveTab('buyer')
              setShowAll(false)
            }}
            className={`flex min-w-0 flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'buyer'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="whitespace-nowrap">Käufer</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('seller')
              setShowAll(false)
            }}
            className={`flex min-w-0 flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'seller'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="h-4 w-4" />
            <span className="whitespace-nowrap">Verkäufer</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('streak')
              setShowAll(false)
            }}
            className={`flex min-w-0 flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'streak'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span className="whitespace-nowrap">Streak</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('loyalty')
              setShowAll(false)
            }}
            className={`flex min-w-0 flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'loyalty'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="h-4 w-4" />
            <span className="whitespace-nowrap">Loyalität</span>
          </button>
        </div>
      </div>

      {/* Badge Items */}
      <div className="space-y-2">
        {displayItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Noch keine Badges in dieser Kategorie
          </p>
        ) : (
          <>
            {displayItems.map((item: any, index: number) => {
              if (item.earnedAt) {
                return <div key={`earned-${index}`}>{renderBadgeItem(item, true)}</div>
              } else if (item.badgeType) {
                return <div key={`progress-${item.badgeType}`}>{renderProgressItem(item)}</div>
              }
              return null
            })}
            {(currentData.earned.length > 3 || currentData.progress.length > 3) && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Alle anzeigen ({currentData.earned.length + currentData.progress.length})
              </button>
            )}
            {showAll && (currentData.earned.length > 3 || currentData.progress.length > 3) && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Weniger anzeigen
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

