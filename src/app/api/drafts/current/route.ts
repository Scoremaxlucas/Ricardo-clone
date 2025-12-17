import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/drafts/current
 * Returns the current draft for the authenticated user
 * Creates one if it doesn't exist
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Find or create draft
    let draft = await prisma.draft.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        draftImages: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (!draft) {
      // Create new draft
      draft = await prisma.draft.create({
        data: {
          userId: session.user.id,
          formData: JSON.stringify({}),
        },
        include: {
          draftImages: true,
        },
      })
    }

    return NextResponse.json({
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: draft.draftImages.map(img => img.url), // Legacy support
        draftImages: draft.draftImages,
      },
    })
  } catch (error) {
    console.error('[Drafts API] Error fetching/creating current draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Entwurfs' },
      { status: 500 }
    )
  }
}

