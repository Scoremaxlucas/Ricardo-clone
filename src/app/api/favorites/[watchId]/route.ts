import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { updateFavoriteCount } from '@/lib/product-stats'

// Favorit entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ watchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { watchId } = await params

    await prisma.favorite.delete({
      where: {
        watchId_userId: {
          watchId,
          userId: session.user.id,
        },
      },
    })

    // Invalidate favorites cache for this user
    const cacheKey = generateCacheKey('/api/favorites', { userId: session.user.id })
    apiCache.delete(cacheKey)

    // Update favorite count in ProductStats (Feature 2)
    updateFavoriteCount(watchId).catch(err => {
      console.error('Error updating favorite count:', err)
    })

    return NextResponse.json({ message: 'Favorit entfernt' })
  } catch (error: any) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json(
      { message: 'Fehler beim Entfernen: ' + error.message },
      { status: 500 }
    )
  }
}
