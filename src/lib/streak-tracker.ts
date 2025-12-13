/**
 * Streak Tracker
 * Feature 9: Gamification - Trackt tägliche Besuche für Streak-Badges
 */

import { checkAndAwardBadges } from './badge-system'
import { prisma } from './prisma'

/**
 * Aktualisiert den Streak eines Users beim Besuch
 */
export async function updateUserStreak(userId: string): Promise<void> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    })

    if (!streak) {
      // Erstelle neuen Streak
      await prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastVisitDate: today,
          totalVisits: 1,
        },
      })

      // Prüfe Badges (kann noch keinen Streak-Badge geben, aber initialisiert)
      await checkAndAwardBadges(userId, 'streak')
      return
    }

    const lastVisit = new Date(streak.lastVisitDate)
    lastVisit.setHours(0, 0, 0, 0)

    const daysSinceLastVisit = Math.floor(
      (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastVisit === 0) {
      // Bereits heute besucht, keine Änderung
      return
    }

    let newCurrentStreak = streak.currentStreak
    let newLongestStreak = streak.longestStreak

    if (daysSinceLastVisit === 1) {
      // Kontinuierlicher Streak
      newCurrentStreak = streak.currentStreak + 1
    } else {
      // Streak unterbrochen
      newCurrentStreak = 1
    }

    // Update longest streak falls nötig
    if (newCurrentStreak > streak.longestStreak) {
      newLongestStreak = newCurrentStreak
    }

    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastVisitDate: today,
        totalVisits: { increment: 1 },
      },
    })

    // Prüfe Streak-Badges
    await checkAndAwardBadges(userId, 'streak')
  } catch (error) {
    // Silent fail - Streak-Tracking sollte nicht die User-Experience beeinträchtigen
    console.error('[StreakTracker] Error updating streak:', error)
  }
}

/**
 * Holt Streak-Informationen eines Users
 */
export async function getUserStreak(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
  totalVisits: number
} | null> {
  try {
    const streak = await prisma.userStreak.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        totalVisits: true,
      },
    })

    return streak
  } catch (error) {
    console.error('[StreakTracker] Error fetching streak:', error)
    return null
  }
}
