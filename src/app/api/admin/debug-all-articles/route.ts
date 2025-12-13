import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Debug endpoint to show ALL articles without any filters
 * CRITICAL: Use this to find missing articles
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
    const searchTerm = searchParams.get('q') || 'lacoste'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get ALL articles without any filters - just search by title/brand/model
    const allArticles = await prisma.watch.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } },
          { model: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        moderationStatus: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        sellerId: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Also get ALL articles (no search filter) to see total count
    const totalCount = await prisma.watch.count()

    return NextResponse.json({
      searchTerm,
      totalArticlesInDatabase: totalCount,
      foundArticles: allArticles.length,
      articles: allArticles.map(article => ({
        id: article.id,
        title: article.title,
        brand: article.brand,
        model: article.model,
        price: article.price,
        moderationStatus: article.moderationStatus,
        createdAt: article.createdAt,
        isAuction: article.isAuction,
        auctionEnd: article.auctionEnd,
        hasPurchases: article.purchases.length > 0,
        activePurchases: article.purchases.filter(p => p.status !== 'cancelled').length,
        categories: article.categories.map((c: any) => c.category.slug),
        wouldPassFilters: {
          moderationStatus: article.moderationStatus !== 'rejected',
          noActivePurchases: article.purchases.filter(p => p.status !== 'cancelled').length === 0,
          auctionCheck: !article.isAuction || !article.auctionEnd || new Date(article.auctionEnd) > new Date(),
        },
      })),
    })
  } catch (error: any) {
    console.error('Error in debug-all-articles:', error)
    return NextResponse.json({
      error: 'Error fetching articles',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, {
      status: 500,
    })
  }
}

