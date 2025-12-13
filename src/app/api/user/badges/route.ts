import { authOptions } from '@/lib/auth'
import { getUserBadges } from '@/lib/badge-system'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für User-Badges (Feature 9: Gamification)
 *
 * GET /api/user/badges - Holt alle Badges eines Users
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const badges = await getUserBadges(session.user.id)

    return NextResponse.json({ badges })
  } catch (error: any) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Badges' }, { status: 500 })
  }
}
