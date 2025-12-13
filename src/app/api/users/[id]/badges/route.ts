import { getUserBadges } from '@/lib/badge-system'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für öffentliche Badge-Anzeige (Feature 9: Gamification)
 *
 * GET /api/users/[id]/badges - Holt alle Badges eines Users (öffentlich)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'User ID erforderlich' }, { status: 400 })
    }

    const badges = await getUserBadges(id)

    return NextResponse.json({ badges })
  } catch (error: any) {
    console.error('Error fetching public badges:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Badges' }, { status: 500 })
  }
}
