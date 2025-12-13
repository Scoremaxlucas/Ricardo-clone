import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAllArticlesVisible, isArticleVisible } from '@/lib/data-protection'

/**
 * Admin endpoint to validate that all articles are still visible
 * CRITICAL: Use this before deployments to ensure no articles disappear
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
      // Check single article
      const result = await isArticleVisible(watchId)
      
      // Get article details
      const article = await prisma.watch.findUnique({
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
        articleId: watchId,
        article: article ? {
          title: article.title,
          brand: article.brand,
          model: article.model,
          moderationStatus: article.moderationStatus,
          categories: article.categories.map((wc: any) => ({
            name: wc.category.name,
            slug: wc.category.slug,
          })),
        } : null,
        ...result,
      })
    }

    if (searchTitle) {
      // Search for articles by title
      const articles = await prisma.watch.findMany({
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
        articles.map(article => isArticleVisible(article.id))
      )
      
      return NextResponse.json({
        searchTitle,
        articles: articles.map((article, index) => ({
          ...article,
          visibility: results[index],
        })),
      })
    }

    // Check all articles
    const validation = await validateAllArticlesVisible()
    
    return NextResponse.json({
      ...validation,
      timestamp: new Date().toISOString(),
      status: validation.hidden === 0 ? 'safe' : 'warning',
      message: validation.hidden === 0 
        ? 'All articles are visible' 
        : `${validation.hidden} articles are hidden - REVIEW BEFORE DEPLOYMENT!`,
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

