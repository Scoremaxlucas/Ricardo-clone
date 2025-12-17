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

    return NextResponse.json({
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: draft.images ? JSON.parse(draft.images) : [],
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

