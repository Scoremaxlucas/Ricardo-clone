import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/sell/drafts/current
 * Get latest draft for authenticated user or null
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Get latest draft for this user
    const draft = await prisma.draft.findFirst({
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
      return NextResponse.json({ draft: null })
    }

    // Parse formData and include image URLs from draftImages
    const imageUrls = draft.draftImages.map(img => img.url)

    return NextResponse.json({
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: imageUrls,
        draftImages: draft.draftImages,
      },
    })
  } catch (error: any) {
    console.error('[Drafts API] Error fetching current draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Entwurfs', error: error.message },
      { status: 500 }
    )
  }
}
