/**
 * Badge System
 * Feature 9: Gamification - Vergibt Badges basierend auf User-Aktionen
 */

import { prisma } from './prisma'

export type BadgeType =
  | 'FIRST_PURCHASE'
  | 'POWER_BUYER_10'
  | 'POWER_BUYER_50'
  | 'POWER_SELLER'
  | 'LOYAL_CUSTOMER'
  | 'STREAK_7'
  | 'STREAK_30'

export interface BadgeInfo {
  type: BadgeType
  name: string
  description: string
  icon: string
  color: string
}

export const BADGE_INFO: Record<BadgeType, BadgeInfo> = {
  FIRST_PURCHASE: {
    type: 'FIRST_PURCHASE',
    name: 'Erster Kauf',
    description: 'Du hast deinen ersten Kauf getätigt!',
    icon: '🎉',
    color: 'bg-green-500',
  },
  POWER_BUYER_10: {
    type: 'POWER_BUYER_10',
    name: 'Power-Käufer',
    description: 'Du hast 10 Käufe getätigt!',
    icon: '🛒',
    color: 'bg-blue-500',
  },
  POWER_BUYER_50: {
    type: 'POWER_BUYER_50',
    name: 'Super-Käufer',
    description: 'Du hast 50 Käufe getätigt!',
    icon: '👑',
    color: 'bg-purple-500',
  },
  POWER_SELLER: {
    type: 'POWER_SELLER',
    name: 'Power-Verkäufer',
    description: 'Du hast deinen ersten Verkauf abgeschlossen!',
    icon: '💼',
    color: 'bg-orange-500',
  },
  LOYAL_CUSTOMER: {
    type: 'LOYAL_CUSTOMER',
    name: 'Treuer Kunde',
    description: 'Du bist seit über einem Jahr Mitglied!',
    icon: '⭐',
    color: 'bg-yellow-500',
  },
  STREAK_7: {
    type: 'STREAK_7',
    name: '7-Tage Streak',
    description: 'Du warst 7 Tage hintereinander aktiv!',
    icon: '🔥',
    color: 'bg-red-500',
  },
  STREAK_30: {
    type: 'STREAK_30',
    name: '30-Tage Streak',
    description: 'Du warst 30 Tage hintereinander aktiv!',
    icon: '💪',
    color: 'bg-indigo-500',
  },
}

/**
 * Prüft und vergibt Badges basierend auf User-Aktionen
 */
export async function checkAndAwardBadges(
  userId: string,
  action: 'purchase' | 'sale' | 'streak'
): Promise<void> {
  try {
    // Hole aktuelle Badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    })

    const existingBadgeTypes = new Set(existingBadges.map(b => b.badgeType))

    const badgesToAward: BadgeType[] = []

    if (action === 'purchase') {
      // Zähle Käufe
      const purchaseCount = await prisma.purchase.count({
        where: { buyerId: userId },
      })

      if (purchaseCount === 1 && !existingBadgeTypes.has('FIRST_PURCHASE')) {
        badgesToAward.push('FIRST_PURCHASE')
      }

      if (purchaseCount >= 10 && !existingBadgeTypes.has('POWER_BUYER_10')) {
        badgesToAward.push('POWER_BUYER_10')
      }

      if (purchaseCount >= 50 && !existingBadgeTypes.has('POWER_BUYER_50')) {
        badgesToAward.push('POWER_BUYER_50')
      }
    }

    if (action === 'sale') {
      // Zähle Verkäufe
      const saleCount = await prisma.sale.count({
        where: { sellerId: userId },
      })

      if (saleCount === 1 && !existingBadgeTypes.has('POWER_SELLER')) {
        badgesToAward.push('POWER_SELLER')
      }
    }

    if (action === 'streak') {
      // Hole Streak-Informationen
      const streak = await prisma.userStreak.findUnique({
        where: { userId },
      })

      if (streak) {
        if (streak.currentStreak >= 7 && !existingBadgeTypes.has('STREAK_7')) {
          badgesToAward.push('STREAK_7')
        }

        if (streak.currentStreak >= 30 && !existingBadgeTypes.has('STREAK_30')) {
          badgesToAward.push('STREAK_30')
        }
      }
    }

    // Prüfe LOYAL_CUSTOMER Badge
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    })

    if (user) {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      if (user.createdAt < oneYearAgo && !existingBadgeTypes.has('LOYAL_CUSTOMER')) {
        badgesToAward.push('LOYAL_CUSTOMER')
      }
    }

    // Vergib Badges
    for (const badgeType of badgesToAward) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeType,
          displayOrder: Object.keys(BADGE_INFO).indexOf(badgeType),
        },
      })

      // Importiere reward-system dynamisch um zirkuläre Abhängigkeiten zu vermeiden
      const { awardRewardsForBadge } = await import('./reward-system')
      await awardRewardsForBadge(userId, badgeType).catch(err => {
        console.error('[BadgeSystem] Error awarding rewards:', err)
      })
    }
  } catch (error) {
    // Silent fail - Badges sollten nicht die Hauptfunktionalität blockieren
    console.error('[BadgeSystem] Error checking badges:', error)
  }
}

/**
 * Holt alle Badges eines Users
 */
export async function getUserBadges(
  userId: string
): Promise<Array<BadgeInfo & { earnedAt: Date }>> {
  try {
    const badges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
    })

    return badges.map(badge => ({
      ...BADGE_INFO[badge.badgeType as BadgeType],
      earnedAt: badge.earnedAt,
    }))
  } catch (error) {
    console.error('[BadgeSystem] Error fetching badges:', error)
    return []
  }
}
