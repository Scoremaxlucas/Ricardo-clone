import { authOptions } from '@/lib/auth'
import { BadgeType } from '@/lib/badge-system'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Badge-Progress (Feature 9: Gamification)
 *
 * GET /api/user/badge-progress - Holt Progress-Informationen für alle möglichen Badges
 */

interface BadgeProgress {
  badgeType: BadgeType
  current: number
  target: number
  progress: number // 0-100
  nextMilestone?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Hole aktuelle Badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    })
    const existingBadgeTypes = new Set(existingBadges.map(b => b.badgeType))

    // Hole User-Daten
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    })

    // Hole Statistiken
    const purchaseCount = await prisma.purchase.count({
      where: { buyerId: userId },
    })

    const saleCount = await prisma.sale.count({
      where: { sellerId: userId },
    })

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    })

    const progress: BadgeProgress[] = []

    // FIRST_PURCHASE
    if (!existingBadgeTypes.has('FIRST_PURCHASE')) {
      progress.push({
        badgeType: 'FIRST_PURCHASE',
        current: purchaseCount,
        target: 1,
        progress: Math.min((purchaseCount / 1) * 100, 100),
        nextMilestone: purchaseCount === 0 ? 'Erstelle deinen ersten Kauf!' : undefined,
      })
    }

    // POWER_BUYER_10
    if (!existingBadgeTypes.has('POWER_BUYER_10')) {
      progress.push({
        badgeType: 'POWER_BUYER_10',
        current: purchaseCount,
        target: 10,
        progress: Math.min((purchaseCount / 10) * 100, 100),
        nextMilestone:
          purchaseCount < 10 ? `Noch ${10 - purchaseCount} Käufe bis Power-Käufer!` : undefined,
      })
    }

    // POWER_BUYER_50
    if (!existingBadgeTypes.has('POWER_BUYER_50')) {
      progress.push({
        badgeType: 'POWER_BUYER_50',
        current: purchaseCount,
        target: 50,
        progress: Math.min((purchaseCount / 50) * 100, 100),
        nextMilestone:
          purchaseCount < 50 ? `Noch ${50 - purchaseCount} Käufe bis Super-Käufer!` : undefined,
      })
    }

    // POWER_SELLER
    if (!existingBadgeTypes.has('POWER_SELLER')) {
      progress.push({
        badgeType: 'POWER_SELLER',
        current: saleCount,
        target: 1,
        progress: Math.min((saleCount / 1) * 100, 100),
        nextMilestone: saleCount === 0 ? 'Verkaufe deinen ersten Artikel!' : undefined,
      })
    }

    // STREAK_7
    if (!existingBadgeTypes.has('STREAK_7')) {
      const currentStreak = streak?.currentStreak || 0
      progress.push({
        badgeType: 'STREAK_7',
        current: currentStreak,
        target: 7,
        progress: Math.min((currentStreak / 7) * 100, 100),
        nextMilestone:
          currentStreak < 7 ? `Noch ${7 - currentStreak} Tage bis 7-Tage Streak!` : undefined,
      })
    }

    // STREAK_30
    if (!existingBadgeTypes.has('STREAK_30')) {
      const currentStreak = streak?.currentStreak || 0
      progress.push({
        badgeType: 'STREAK_30',
        current: currentStreak,
        target: 30,
        progress: Math.min((currentStreak / 30) * 100, 100),
        nextMilestone:
          currentStreak < 30 ? `Noch ${30 - currentStreak} Tage bis 30-Tage Streak!` : undefined,
      })
    }

    // LOYAL_CUSTOMER
    if (!existingBadgeTypes.has('LOYAL_CUSTOMER') && user) {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const daysSinceJoin = Math.floor(
        (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysUntilOneYear = 365 - daysSinceJoin

      progress.push({
        badgeType: 'LOYAL_CUSTOMER',
        current: daysSinceJoin,
        target: 365,
        progress: Math.min((daysSinceJoin / 365) * 100, 100),
        nextMilestone:
          daysUntilOneYear > 0 ? `Noch ${daysUntilOneYear} Tage bis Treuer Kunde!` : undefined,
      })
    }

    return NextResponse.json({ progress })
  } catch (error: any) {
    console.error('Error fetching badge progress:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Badge-Progress' }, { status: 500 })
  }
}
