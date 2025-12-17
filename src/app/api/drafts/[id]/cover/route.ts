import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH: Set cover image for a draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: draftId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verify draft exists and belongs to user
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf zu bearbeiten' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { coverImageId } = body

    // Verify image exists and belongs to this draft
    if (coverImageId) {
      const image = await prisma.draftImage.findUnique({
        where: { id: coverImageId },
      })

      if (!image || image.draftId !== draftId) {
        return NextResponse.json({ message: 'Bild nicht gefunden' }, { status: 404 })
      }
    }

    // Update draft
    await prisma.draft.update({
      where: { id: draftId },
      data: { coverImageId },
    })

    return NextResponse.json({ message: 'Titelbild aktualisiert', coverImageId })
  } catch (error: any) {
    console.error('[Drafts API] Error updating cover image:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren des Titelbildes', error: error.message },
      { status: 500 }
    )
  }
}

