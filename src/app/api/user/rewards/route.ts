import { authOptions } from '@/lib/auth'
import { getUserRewards } from '@/lib/reward-system'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für User-Rewards (Feature 9: Gamification)
 *
 * GET /api/user/rewards - Holt alle aktiven Belohnungen eines Users
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const rewards = await getUserRewards(session.user.id)

    return NextResponse.json({ rewards })
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Belohnungen' }, { status: 500 })
  }
}
