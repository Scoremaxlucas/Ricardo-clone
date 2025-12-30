import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to check if Lacoste article appears in search results
 */
export async function GET(request: NextRequest) {
  try {
    const articleId = 'cmipseh3y0001bbm7ew1n8atm'
    const now = new Date()

    // Get article directly
    const article = await prisma.watch.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        brand: true,
        moderationStatus: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        purchases: {
          select: { id: true, status: true },
        },
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            city: true,
            postalCode: true,
          },
        },
        images: true,
        price: true,
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Test search query (same as /api/articles/search)
    // RICARDO-STYLE: Exclude blocked, removed, ended
    const searchResults = await prisma.watch.findMany({
      where: {
        AND: [
          {
            OR: [
              { moderationStatus: null },
              { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
            ],
          },
          {
            OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
          },
          {
            OR: [
              { auctionEnd: null },
              { auctionEnd: { gt: now } },
              {
                AND: [
                  { auctionEnd: { lte: now } },
                  { purchases: { some: { status: { not: 'cancelled' } } } },
                ],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const articleInResults = searchResults.some(a => a.id === articleId)
    const position = searchResults.findIndex(a => a.id === articleId)

    // Simulate the mapping process
    let mappedArticle = null
    try {
      const highestBid = null // No bids
      const currentPrice = article.price || 0

      // Parse images
      let images: string[] = []
      try {
        if (article.images) {
          if (Array.isArray(article.images)) {
            images = article.images
          } else if (typeof article.images === 'string') {
            if (article.images.trim().startsWith('[') || article.images.trim().startsWith('{')) {
              images = JSON.parse(article.images)
            } else if (article.images.trim().startsWith('http')) {
              images = [article.images]
            } else {
              images = article.images.trim() ? [article.images] : []
            }
          }
        }
      } catch (e) {
        images = []
      }

      const categorySlugs =
        article.categories?.map((cat: any) => cat.category?.slug).filter(Boolean) || []

      mappedArticle = {
        id: article.id,
        title: article.title || '',
        price: currentPrice,
        images: images,
        categorySlugs: categorySlugs,
        seller: article.seller
          ? {
              city: article.seller.city,
              postalCode: article.seller.postalCode,
            }
          : null,
      }
    } catch (e) {
      console.error('Error mapping article:', e)
    }

    return NextResponse.json({
      article: {
        ...article,
        inSearchResults: articleInResults,
        position: position >= 0 ? position + 1 : null,
        mappedSuccessfully: mappedArticle !== null,
        mappedArticle: mappedArticle,
      },
      searchResults: {
        total: searchResults.length,
        articleInResults,
        position: position >= 0 ? position + 1 : null,
        top5: searchResults.slice(0, 5).map(a => ({
          id: a.id,
          title: a.title,
          createdAt: a.createdAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error in test-lacoste:', error)
    return NextResponse.json(
      {
        error: 'Error checking article',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
