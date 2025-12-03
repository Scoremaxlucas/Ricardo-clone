import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Performance metrics endpoint (Admin only)
 * Returns detailed performance metrics for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }
    
    const startTime = Date.now()
    
    // Get database performance metrics
    const dbStartTime = Date.now()
    const [watchCount, userCount, purchaseCount, bidCount] = await Promise.all([
      prisma.watch.count(),
      prisma.user.count(),
      prisma.purchase.count(),
      prisma.bid.count(),
    ])
    const dbQueryTime = Date.now() - dbStartTime
    
    // Get active watches count (not sold)
    const activeWatchesStart = Date.now()
    const activeWatches = await prisma.watch.count({
      where: {
        purchases: {
          none: {
            status: {
              not: 'cancelled',
            },
          },
        },
      },
    })
    const activeWatchesQueryTime = Date.now() - activeWatchesStart
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      performance: {
        totalResponseTime: `${totalTime}ms`,
        database: {
          queryTime: `${dbQueryTime}ms`,
          activeWatchesQueryTime: `${activeWatchesQueryTime}ms`,
          performance: dbQueryTime < 100 ? 'excellent' : dbQueryTime < 200 ? 'good' : 'needs_optimization',
        },
      },
      stats: {
        watches: {
          total: watchCount,
          active: activeWatches,
          sold: watchCount - activeWatches,
        },
        users: userCount,
        purchases: purchaseCount,
        bids: bidCount,
      },
      recommendations: [
        ...(dbQueryTime > 200 ? ['Consider adding database indexes (see scripts/add-database-indexes.sql)'] : []),
        ...(activeWatchesQueryTime > 100 ? ['Optimize active watches query with better indexes'] : []),
        ...(totalTime > 500 ? ['API response time is slow, check database connection pool settings'] : []),
      ],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to fetch metrics',
      message: error.message,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}

