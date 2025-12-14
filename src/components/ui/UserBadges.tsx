'use client'

import { BadgeInfo } from '@/lib/badge-system'
import { useEffect, useState } from 'react'

interface UserBadgesProps {
  userId: string
  limit?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * UserBadges Komponente (Feature 9: Gamification)
 *
 * Zeigt Top-Badges als kompakte Icons neben Usernamen
 */
export function UserBadges({ userId, limit = 2, size = 'sm', className = '' }: UserBadgesProps) {
  const [badges, setBadges] = useState<Array<BadgeInfo & { earnedAt: Date }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchBadges = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/badges`)
        if (response.ok) {
          const data = await response.json()
          const badgesList = data.badges || []
          // Sortiere nach displayOrder und nehme Top-Badges
          setBadges(badgesList.slice(0, limit))
        }
      } catch (error) {
        console.error('Error fetching user badges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId, limit])

  if (loading || badges.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base',
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`flex items-center justify-center rounded-full ${badge.color} ${sizeClasses[size]} text-white`}
          title={`${badge.name}: ${badge.description}`}
        >
          {badge.icon}
        </span>
      ))}
    </span>
  )
}
