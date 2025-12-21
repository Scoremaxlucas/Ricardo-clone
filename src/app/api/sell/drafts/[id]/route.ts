import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/sell/drafts/[id]
 * Delete draft only if userId matches authenticated user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership - draft must belong to authenticated user
    const draft = await prisma.draft.findUnique({
      where: { id },
      select: {
        userId: true,
      },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf zu löschen' },
        { status: 403 }
      )
    }

    await prisma.draft.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Entwurf gelöscht' })
  } catch (error: any) {
    console.error('[Drafts API] Error deleting draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Entwurfs', error: error.message },
      { status: 500 }
    )
  }
}
