import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für ProductStats (Feature 2: Social Proof Widget)
 *
 * GET /api/products/stats?watchIds=id1,id2,id3
 *
 * Gibt Statistiken für mehrere Produkte zurück:
 * - favoriteCount: Anzahl Favoriten
 * - viewCount: Anzahl Views
 * - soldLast24h: Anzahl Verkäufe in den letzten 24 Stunden
 * - viewersNow: Aktuelle Viewer (geschätzt)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const watchIdsParam = searchParams.get('watchIds')

    if (!watchIdsParam) {
      return NextResponse.json(
        { error: 'watchIds parameter is required' },
        { status: 400 }
      )
    }

    const watchIds = watchIdsParam.split(',').filter(Boolean)

    if (watchIds.length === 0) {
      return NextResponse.json({ stats: [] })
    }

    // Hole alle ProductStats für die angegebenen Watch-IDs
    const productStats = await prisma.productStats.findMany({
      where: {
        watchId: {
          in: watchIds,
        },
      },
    })

    // Hole zusätzliche Daten für Produkte ohne ProductStats-Eintrag
    const statsMap = new Map(productStats.map(stat => [stat.watchId, stat]))

    // Für jedes Watch-ID, hole aktuelle Statistiken
    const statsPromises = watchIds.map(async watchId => {
      const existingStat = statsMap.get(watchId)

      // Hole aktuelle Favoriten-Anzahl
      const favoriteCount = await prisma.favorite.count({
        where: { watchId },
      })

      // Hole View-Anzahl der letzten 30 Tage
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

      // Hole Verkäufe der letzten 24 Stunden
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      const soldLast24h = await prisma.purchase.count({
        where: {
          watchId,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
          status: {
            not: 'cancelled',
          },
        },
      })

      // Schätze aktuelle Viewer (Views der letzten 5 Minuten)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
      const viewersNow = await prisma.watchView.count({
        where: {
          watchId,
          viewedAt: {
            gte: fiveMinutesAgo,
          },
        },
        distinct: ['userId', 'ipAddress'],
      })

      // Update oder erstelle ProductStats-Eintrag
      const updatedStat = await prisma.productStats.upsert({
        where: { watchId },
        update: {
          favoriteCount,
          viewCount,
          soldLast24h,
          viewersNow,
          lastUpdated: new Date(),
        },
        create: {
          watchId,
          favoriteCount,
          viewCount,
          soldLast24h,
          viewersNow,
          lastUpdated: new Date(),
        },
      })

      return {
        watchId,
        favoriteCount: updatedStat.favoriteCount,
        viewCount: updatedStat.viewCount,
        soldLast24h: updatedStat.soldLast24h,
        viewersNow: updatedStat.viewersNow,
        lastUpdated: updatedStat.lastUpdated,
      }
    })

    const stats = await Promise.all(statsPromises)

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Error fetching product stats:', error)
    return NextResponse.json(
      {
        error: 'Error fetching product stats',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
