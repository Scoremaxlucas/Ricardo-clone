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

    // 2. Simple query - only select columns that exist in DB
    const watches = await prisma.watch.findMany({
      select: {
        id: true,
        articleNumber: true,
        title: true,
        description: true,
        brand: true,
        model: true,
        price: true,
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        moderationStatus: true,
        sellerId: true,
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

    // 3. Process watches - RICARDO-STYLE STATUS
    const now = new Date()
    const processedWatches = watches.map(watch => {
      // Parse images
      let images: string[] = []
      try {
        images = watch.images ? JSON.parse(watch.images) : []
      } catch {
        images = []
      }

      // Calculate Ricardo-style status
      const activePurchases = (watch.purchases || []).filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
      const auctionEnd = watch.auctionEnd ? new Date(watch.auctionEnd) : null
      const isExpired = auctionEnd ? auctionEnd <= now : false

      // RICARDO-STYLE: Status-Logik
      // moderationStatus: 'pending' | 'rejected' | 'blocked' | 'removed' | 'ended' | null
      // 'approved' entfernt - hatte keinen praktischen Nutzen
      const status = watch.moderationStatus || 'pending'
      const isBlocked = status === 'blocked'
      const isRemoved = status === 'removed'
      const isEnded = status === 'ended' || isSold || isExpired
      // Legacy: approved wird als pending behandelt (beide sind sichtbar)
      const isPending = status === 'pending' || status === 'approved' || !watch.moderationStatus

      // Legacy isActive für Rückwärtskompatibilität
      // Artikel mit pending/approved sind beide sichtbar
      const isActive = isPending && !isSold && !isExpired

      // Ricardo-Style: Bestimme den angezeigten Status (approved entfernt)
      let displayStatus: 'pending' | 'blocked' | 'removed' | 'ended' | 'sold'
      if (isSold) {
        displayStatus = 'sold'
      } else if (isBlocked) {
        displayStatus = 'blocked'
      } else if (isRemoved) {
        displayStatus = 'removed'
      } else if (isExpired || status === 'ended') {
        displayStatus = 'ended'
      } else {
        // pending oder approved (beide werden als pending angezeigt)
        displayStatus = 'pending'
      }

      return {
        ...watch,
        images,
        isActive, // Legacy
        isSold,
        displayStatus, // RICARDO-STYLE
        categories: [],
        viewCount: 0,
        favoriteCount: 0,
        pendingReports: 0,
        noteCount: 0,
      }
    })

    // 4. Filter based on query params - RICARDO-STYLE FILTERS
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    let filteredWatches = processedWatches
    switch (filter) {
      case 'pending': // Ausstehend (Live - approved wird auch als pending behandelt)
        filteredWatches = processedWatches.filter(
          w => w.displayStatus === 'pending' || w.moderationStatus === 'approved'
        )
        break
        filteredWatches = processedWatches.filter(w => w.displayStatus === 'pending')
        break
      case 'blocked': // Gesperrt
        filteredWatches = processedWatches.filter(w => w.displayStatus === 'blocked')
        break
      case 'removed': // Entfernt
        filteredWatches = processedWatches.filter(w => w.displayStatus === 'removed')
        break
      case 'ended': // Beendet (verkauft/abgelaufen)
        filteredWatches = processedWatches.filter(
          w => w.displayStatus === 'ended' || w.displayStatus === 'sold'
        )
        break
      // Legacy Filter für Rückwärtskompatibilität
      case 'active':
        filteredWatches = processedWatches.filter(w => w.isActive)
        break
      case 'inactive':
        filteredWatches = processedWatches.filter(w => !w.isActive)
        break
      case 'all':
      default:
        // Alle anzeigen
        break
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
    return NextResponse.json({ message: 'Fehler: ' + err.message }, { status: 500 })
  }
}
