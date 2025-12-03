import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint for monitoring
 * Returns database connection status and basic performance metrics
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test database connection with a simple query
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbQueryTime = Date.now() - dbStartTime
    
    // Get basic stats
    const [watchCount, userCount] = await Promise.all([
      prisma.watch.count(),
      prisma.user.count(),
    ])
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        queryTime: `${dbQueryTime}ms`,
        performance: dbQueryTime < 50 ? 'excellent' : dbQueryTime < 100 ? 'good' : 'slow',
      },
      stats: {
        watches: watchCount,
        users: userCount,
      },
      performance: {
        totalResponseTime: `${totalTime}ms`,
        performance: totalTime < 200 ? 'excellent' : totalTime < 500 ? 'good' : 'needs_optimization',
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
      },
      performance: {
        totalResponseTime: `${totalTime}ms`,
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}

