import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // 1. Check session
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // 2. Simple query - just get watches with seller
    const watches = await prisma.watch.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
            verified: true,
          },
        },
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 3. Process watches
    const now = new Date()
    const processedWatches = watches.map(watch => {
      // Parse images
      let images: string[] = []
      try {
        images = watch.images ? JSON.parse(watch.images) : []
      } catch {
        images = []
      }

      // Calculate status
      const activePurchases = (watch.purchases || []).filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
      const auctionEnd = watch.auctionEnd ? new Date(watch.auctionEnd) : null
      const isExpired = auctionEnd ? auctionEnd <= now : false
      const isActive = !isSold && !isExpired && watch.moderationStatus !== 'rejected'

      return {
        ...watch,
        images,
        isActive,
        isSold,
        categories: [],
        viewCount: 0,
        favoriteCount: 0,
        pendingReports: 0,
        noteCount: 0,
      }
    })

    // 4. Filter based on query params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    let filteredWatches = processedWatches
    if (filter === 'active') {
      filteredWatches = processedWatches.filter(w => w.isActive)
    } else if (filter === 'inactive') {
      filteredWatches = processedWatches.filter(w => !w.isActive)
    } else if (filter === 'pending') {
      filteredWatches = processedWatches.filter(
        w => w.moderationStatus === 'pending' || !w.moderationStatus
      )
    }

    return NextResponse.json({
      watches: filteredWatches,
      total: filteredWatches.length,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[admin/watches] Error:', err.message, err.stack)
    return NextResponse.json(
      { message: 'Fehler: ' + err.message },
      { status: 500 }
    )
  }
}
