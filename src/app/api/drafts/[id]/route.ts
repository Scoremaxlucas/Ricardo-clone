import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelnen Entwurf abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const draft = await prisma.draft.findUnique({
      where: { id },
      include: {
        draftImages: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf anzusehen' },
        { status: 403 }
      )
    }

    // Legacy support: include images array from draftImages
    const imageUrls = draft.draftImages.map(img => img.url)

    return NextResponse.json({
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: imageUrls, // Legacy support
        draftImages: draft.draftImages,
      },
    })
  } catch (error) {
    console.error('[Drafts API] Error fetching draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Entwurfs' },
      { status: 500 }
    )
  }
}

// DELETE: Entwurf löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verify ownership before deleting
    const draft = await prisma.draft.findUnique({
      where: { id },
      select: { userId: true },
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

    // Delete the draft (CASCADE will handle draftImages)
    await prisma.draft.delete({
      where: { id },
    })

    console.log(`[Drafts API] Deleted draft ${id} for user ${session.user.id}`)

    return NextResponse.json({ message: 'Entwurf gelöscht' })
  } catch (error: any) {
    console.error('[Drafts API] Error deleting draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Entwurfs', error: error.message },
      { status: 500 }
    )
  }
}

