import { authOptions } from '@/lib/auth'
import { trackBrowsingHistory } from '@/lib/browsing-tracker'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route zum Tracken von Produkt-Views (Feature 2: Social Proof)
 *
 * POST /api/products/[id]/view
 *
 * Erstellt einen WatchView-Eintrag und aktualisiert ProductStats
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: watchId } = await params

    if (!watchId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Prüfe ob Produkt existiert
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
    })

    if (!watch) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Hole Session (optional - Views können auch anonym sein)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Hole IP-Adresse und User-Agent aus Request
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null
    const userAgent = request.headers.get('user-agent') || null

    // Erstelle WatchView-Eintrag
    await prisma.watchView.create({
      data: {
        watchId,
        userId,
        ipAddress,
        userAgent,
      },
    })

    // Aktualisiere ProductStats (asynchron, blockiert nicht)
    // Verwende upsert um sicherzustellen, dass ein Eintrag existiert
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const viewCount = await prisma.watchView.count({
      where: {
        watchId,
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    // Count distinct viewers (unique userId + ipAddress combinations)
    // Prisma count doesn't support distinct with multiple fields, so we use groupBy
    const viewerGroups = await prisma.watchView.groupBy({
      by: ['userId', 'ipAddress'],
      where: {
        watchId,
        viewedAt: {
          gte: fiveMinutesAgo,
        },
      },
    })
    const viewersNow = viewerGroups.length

    // Update ProductStats
    await prisma.productStats.upsert({
      where: { watchId },
      update: {
        viewCount,
        viewersNow,
        lastUpdated: new Date(),
      },
      create: {
        watchId,
        viewCount,
        viewersNow,
        favoriteCount: 0,
        soldLast24h: 0,
        lastUpdated: new Date(),
      },
    })

    // Track browsing history (Feature 5: Personalisierung)
    if (userId) {
      trackBrowsingHistory({
        userId,
        watchId,
        action: 'view',
      }).catch(err => {
        console.error('[ViewRoute] Error tracking browsing history:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error tracking product view:', error)
    return NextResponse.json(
      {
        error: 'Error tracking product view',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
