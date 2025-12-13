'use client'

import { BadgeInfo, BADGE_INFO } from '@/lib/badge-system'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

/**
 * Custom Hook für Badge-Notifications
 * Prüft auf neue Badges und zeigt Toast-Benachrichtigungen
 */
export function useBadgeNotifications(userId?: string) {
  const previousBadgesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return

    const checkForNewBadges = async () => {
      try {
        const response = await fetch('/api/user/badges')
        if (response.ok) {
          const data = await response.json()
          const currentBadges = new Set(
            (data.badges || []).map((b: BadgeInfo & { earnedAt: Date }) => b.type)
          )

          // Finde neue Badges
          const newBadges = Array.from(currentBadges).filter(
            badgeType => !previousBadgesRef.current.has(badgeType)
          )

          // Zeige Toast für jedes neue Badge
          newBadges.forEach(badgeType => {
            const badgeInfo = BADGE_INFO[badgeType as keyof typeof BADGE_INFO]
            if (badgeInfo) {
              toast.success(
                (t) => (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{badgeInfo.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{badgeInfo.name}</div>
                      <div className="text-sm text-gray-600">{badgeInfo.description}</div>
                    </div>
                  </div>
                ),
                {
                  duration: 5000,
                  position: 'top-right',
                  style: {
                    background: '#fff',
                    color: '#374151',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e5e7eb',
                  },
                  icon: badgeInfo.icon,
                }
              )
            }
          })

          // Update previous badges
          previousBadgesRef.current = currentBadges
        }
      } catch (error) {
        console.error('[useBadgeNotifications] Error checking badges:', error)
      }
    }

    // Initial check
    checkForNewBadges()

    // Check alle 5 Sekunden (für Demo-Zwecke, kann später optimiert werden)
    const interval = setInterval(checkForNewBadges, 5000)

    return () => clearInterval(interval)
  }, [userId])
}
