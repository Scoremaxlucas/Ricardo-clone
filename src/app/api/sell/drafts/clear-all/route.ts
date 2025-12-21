import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/sell/drafts/clear-all
 * Delete ALL drafts for authenticated user
 * Called after successful publish to ensure no orphan drafts
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Delete all drafts for this user
    const result = await prisma.draft.deleteMany({
      where: {
        userId: session.user.id,
      },
    })

    console.log(`[Drafts API] Cleared ${result.count} drafts for user ${session.user.id}`)

    return NextResponse.json({
      message: 'Alle Entwürfe gelöscht',
      count: result.count,
    })
  } catch (error: any) {
    console.error('[Drafts API] Error clearing all drafts:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen der Entwürfe', error: error.message },
      { status: 500 }
    )
  }
}
