import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isArticleVisible } from '@/lib/data-protection'

/**
 * Admin endpoint to find and check article status
 * Useful for debugging missing articles
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
    const searchTerm = searchParams.get('q') || searchParams.get('search') || 'lacoste'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Search for articles by title, brand, or model
    const articles = await prisma.watch.findMany({
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
        updatedAt: true,
        isAuction: true,
        auctionEnd: true,
        sellerId: true,
        purchases: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Check visibility for each article
    const articlesWithVisibility = await Promise.all(
      articles.map(async (article) => {
        const visibility = await isArticleVisible(article.id)
        return {
          ...article,
          visibility,
          isVisible: visibility.visible,
          visibilityReason: visibility.reason,
        }
      })
    )

    // Check if articles would appear in search
    const now = new Date()
    const searchFilterCheck = articles.map((article) => {
      const hasActivePurchases = article.purchases.some(p => p.status !== 'cancelled')
      const isAuctionExpired = article.isAuction && article.auctionEnd && new Date(article.auctionEnd) <= now
      const wouldAppearInSearch = 
        article.moderationStatus !== 'rejected' &&
        !hasActivePurchases &&
        (!isAuctionExpired || hasActivePurchases)

      return {
        id: article.id,
        title: article.title,
        wouldAppearInSearch,
        reasons: {
          moderationStatus: article.moderationStatus !== 'rejected',
          noActivePurchases: !hasActivePurchases,
          auctionNotExpired: !isAuctionExpired || hasActivePurchases,
        },
      }
    })

    return NextResponse.json({
      searchTerm,
      totalFound: articles.length,
      articles: articlesWithVisibility,
      searchFilterCheck,
      summary: {
        visible: articlesWithVisibility.filter(a => a.isVisible).length,
        hidden: articlesWithVisibility.filter(a => !a.isVisible).length,
        wouldAppearInSearch: searchFilterCheck.filter(a => a.wouldAppearInSearch).length,
      },
    })
  } catch (error: any) {
    console.error('Error finding articles:', error)
    return NextResponse.json({
      error: 'Error finding articles',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, {
      status: 500,
    })
  }
}

