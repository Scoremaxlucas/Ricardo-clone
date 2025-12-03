import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAllWatchesVisible, isWatchVisible } from '@/lib/data-protection'

/**
 * Admin endpoint to validate that all watches are still visible
 * CRITICAL: Use this before deployments to ensure no watches disappear
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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

    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')
    const searchTitle = searchParams.get('searchTitle') // Suche nach Titel (z.B. "lacoste")

    if (watchId) {
      // Check single watch
      const result = await isWatchVisible(watchId)
      
      // Get watch details
      const watch = await prisma.watch.findUnique({
        where: { id: watchId },
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          moderationStatus: true,
          purchases: {
            select: { id: true, status: true },
          },
          auctionEnd: true,
          isAuction: true,
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      })
      
      return NextResponse.json({
        watchId,
        watch: watch ? {
          title: watch.title,
          brand: watch.brand,
          model: watch.model,
          moderationStatus: watch.moderationStatus,
          categories: watch.categories.map((wc: any) => ({
            name: wc.category.name,
            slug: wc.category.slug,
          })),
        } : null,
        ...result,
      })
    }

    if (searchTitle) {
      // Search for watches by title
      const watches = await prisma.watch.findMany({
        where: {
          title: {
            contains: searchTitle,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          moderationStatus: true,
        },
        take: 20,
      })
      
      const results = await Promise.all(
        watches.map(watch => isWatchVisible(watch.id))
      )
      
      return NextResponse.json({
        searchTitle,
        watches: watches.map((watch, index) => ({
          ...watch,
          visibility: results[index],
        })),
      })
    }

    // Check all watches
    const validation = await validateAllWatchesVisible()
    
    return NextResponse.json({
      ...validation,
      timestamp: new Date().toISOString(),
      status: validation.hidden === 0 ? 'safe' : 'warning',
      message: validation.hidden === 0 
        ? 'All watches are visible' 
        : `${validation.hidden} watches are hidden - REVIEW BEFORE DEPLOYMENT!`,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Validation failed',
      message: error.message,
    }, {
      status: 500,
    })
  }
}

