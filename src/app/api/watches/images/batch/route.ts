import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * OPTIMIERT: Batch API für mehrere Produktbilder auf einmal
 * Reduziert Anzahl der API-Calls drastisch (von N auf 1)
 */
export async function POST(request: NextRequest) {
  try {
    // OPTIMIERT: Besseres Error-Handling für fehlerhafte Requests
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json({ images: {} }, { status: 400 })
    }

    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ images: {} }, { status: 200 })
    }

    // Limit batch size to prevent abuse
    const limitedIds = ids.slice(0, 20) // Max 20 products at once

    // Fetch all watches in parallel
    const watches = await prisma.watch.findMany({
      where: {
        id: { in: limitedIds },
      },
      select: {
        id: true,
        images: true,
      },
    })

    // Parse images for each watch
    const imagesMap: Record<string, string[]> = {}
    watches.forEach(watch => {
      let images: string[] = []
      if (watch.images) {
        try {
          const parsed = typeof watch.images === 'string' ? JSON.parse(watch.images) : watch.images
          images = Array.isArray(parsed) ? parsed : []
        } catch (error) {
          console.error(`Error parsing images for watch ${watch.id}:`, error)
          images = []
        }
      }
      imagesMap[watch.id] = images
    })

    // Add empty arrays for missing IDs
    limitedIds.forEach(id => {
      if (!imagesMap[id]) {
        imagesMap[id] = []
      }
    })

    return NextResponse.json({ images: imagesMap }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error fetching batch images:', error)
    // WICHTIG: Immer gültiges JSON zurückgeben, auch bei Fehlern
    return NextResponse.json({ images: {}, error: error.message || 'Unknown error' }, { status: 200 })
  }
}

