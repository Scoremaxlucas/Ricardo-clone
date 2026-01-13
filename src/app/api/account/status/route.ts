import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/status
 *
 * Gibt den aktuellen Kontostatus zurück
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        deletionScheduledAt: true,
        deletionConfirmedAt: true,
        deletionRequestedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      blockedAt: user.blockedAt,
      deletionScheduledAt: user.deletionScheduledAt,
      deletionConfirmedAt: user.deletionConfirmedAt,
      deletionRequestedAt: user.deletionRequestedAt,
      canReactivate:
        user.blockedReason === 'DELETION_SCHEDULED' &&
        user.deletionScheduledAt &&
        user.deletionScheduledAt > new Date(),
    })
  } catch (error) {
    console.error('[account-status] Fehler:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
