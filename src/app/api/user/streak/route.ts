import { authOptions } from '@/lib/auth'
import { getUserStreak, updateUserStreak } from '@/lib/streak-tracker'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Streak-Tracking (Feature 9: Gamification)
 *
 * GET /api/user/streak - Holt Streak-Informationen
 * POST /api/user/streak - Aktualisiert Streak beim Besuch
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const streak = await getUserStreak(session.user.id)

    if (!streak) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        totalVisits: 0,
      })
    }

    return NextResponse.json(streak)
  } catch (error: any) {
    console.error('Error fetching streak:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Streaks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    await updateUserStreak(session.user.id)

    const streak = await getUserStreak(session.user.id)

    return NextResponse.json(streak || { currentStreak: 0, longestStreak: 0, totalVisits: 0 })
  } catch (error: any) {
    console.error('Error updating streak:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Streaks' }, { status: 500 })
  }
}
