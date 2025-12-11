import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API Route für Produkt-Statistiken (Feature 2: Social Proof)
 * 
 * GET /api/products/[id]/stats
 * 
 * Gibt Statistiken für ein Produkt zurück:
 * - viewCount: Anzahl der Aufrufe
 * - favoriteCount: Anzahl der Favoriten
 * - soldLast24h: Anzahl verkauft in letzten 24h (für ähnliche Produkte)
 * - viewersNow: Aktuelle Anzahl der Viewer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const watchId = id

    // Hole oder erstelle ProductStats Eintrag
    let stats = await prisma.productStats.findUnique({
      where: { watchId },
    })

    // Wenn kein Stats-Eintrag existiert, erstelle einen
    if (!stats) {
      // Berechne initiale Werte
      const favoriteCount = await prisma.favorite.count({
        where: { watchId },
      })

      // Prüfe ob Produkt in letzten 24h verkauft wurde
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)

      const soldLast24h = await prisma.purchase.count({
        where: {
          watchId,
          createdAt: { gte: yesterday },
          status: { not: 'cancelled' },
        },
      })

      // Erstelle neuen Stats-Eintrag
      stats = await prisma.productStats.create({
        data: {
          watchId,
          favoriteCount,
          viewCount: 0,
          soldLast24h,
          viewersNow: 0,
        },
      })
    }

    // Berechne "soldLast24h" für ähnliche Produkte (gleiche Kategorie)
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      select: {
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
      },
    })

    let similarSoldLast24h = 0
    if (watch && watch.categories.length > 0) {
      const categorySlugs = watch.categories.map(c => c.category.slug)
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)

      similarSoldLast24h = await prisma.purchase.count({
        where: {
          watch: {
            categories: {
              some: {
                category: {
                  slug: { in: categorySlugs },
                },
              },
            },
          },
          createdAt: { gte: yesterday },
          status: { not: 'cancelled' },
        },
      })
    }

    return NextResponse.json({
      watchId,
      viewCount: stats.viewCount,
      favoriteCount: stats.favoriteCount,
      soldLast24h: stats.soldLast24h,
      similarSoldLast24h,
      viewersNow: stats.viewersNow,
      lastUpdated: stats.lastUpdated,
    })
  } catch (error: any) {
    console.error('Error fetching product stats:', error)
    return NextResponse.json(
      {
        watchId: null,
        viewCount: 0,
        favoriteCount: 0,
        soldLast24h: 0,
        similarSoldLast24h: 0,
        viewersNow: 0,
        error: 'Error fetching stats',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/stats
 * 
 * Trackt einen View für ein Produkt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const watchId = id

    // Hole oder erstelle ProductStats Eintrag
    let stats = await prisma.productStats.findUnique({
      where: { watchId },
    })

    if (!stats) {
      // Erstelle neuen Stats-Eintrag
      stats = await prisma.productStats.create({
        data: {
          watchId,
          favoriteCount: 0,
          viewCount: 0,
          soldLast24h: 0,
          viewersNow: 0,
        })
      }
    }

    // Inkrementiere viewCount
    const updatedStats = await prisma.productStats.update({
      where: { watchId },
      data: {
        viewCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      viewCount: updatedStats.viewCount,
    })
  } catch (error: any) {
    console.error('Error tracking product view:', error)
    return NextResponse.json(
      { success: false, error: 'Error tracking view' },
      { status: 500 }
    )
  }
}
