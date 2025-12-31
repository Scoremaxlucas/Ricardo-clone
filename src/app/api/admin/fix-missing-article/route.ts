import { shouldShowDetailedErrors } from "@/lib/env"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Auto-fix endpoint to find and repair missing articles
 * Searches for articles and fixes common issues that prevent them from being visible
 */
export async function POST(request: NextRequest) {
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

    // Find all articles matching the search term
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
        moderationStatus: true,
        isAuction: true,
        auctionEnd: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    const fixes: Array<{ id: string; title: string; fixes: string[] }> = []
    const now = new Date()

    for (const article of articles) {
      const articleFixes: string[] = []
      
      // Fix 1: Set moderationStatus to 'pending' if it's null or 'rejected'
      if (!article.moderationStatus || article.moderationStatus === 'rejected') {
        await prisma.watch.update({
          where: { id: article.id },
          data: { moderationStatus: 'pending' },
        })
        articleFixes.push(`Set moderationStatus from '${article.moderationStatus || 'null'}' to 'pending'`)
      }

      // Fix 2: Cancel any active purchases if article should be visible
      const activePurchases = article.purchases.filter(p => p.status !== 'cancelled')
      if (activePurchases.length > 0 && article.moderationStatus !== 'rejected') {
        // Only cancel if we want to make the article visible
        // Actually, we shouldn't cancel purchases automatically - that's business logic
        // So we skip this fix
      }

      // Fix 3: If auction expired without purchase, extend it or convert to buy-now
      if (article.isAuction && article.auctionEnd && new Date(article.auctionEnd) <= now) {
        const hasActivePurchases = article.purchases.some(p => p.status !== 'cancelled')
        if (!hasActivePurchases) {
          // Extend auction by 7 days
          const newEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          await prisma.watch.update({
            where: { id: article.id },
            data: { auctionEnd: newEndDate },
          })
          articleFixes.push(`Extended expired auction to ${newEndDate.toISOString()}`)
        }
      }

      if (articleFixes.length > 0) {
        fixes.push({
          id: article.id,
          title: article.title,
          fixes: articleFixes,
        })
      }
    }

    return NextResponse.json({
      success: true,
      searchTerm,
      foundArticles: articles.length,
      fixedArticles: fixes.length,
      fixes,
      message: fixes.length > 0 
        ? `Fixed ${fixes.length} article(s)` 
        : 'No fixes needed - all articles are already visible',
    })
  } catch (error: any) {
    console.error('Error in fix-missing-article:', error)
    return NextResponse.json({
      error: 'Error fixing articles',
      message: error.message,
      stack: shouldShowDetailedErrors() ? error.stack : undefined,
    }, {
      status: 500,
    })
  }
}

/**
 * GET method to check articles without fixing
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
        moderationStatus: true,
        isAuction: true,
        auctionEnd: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    const issues: Array<{ id: string; title: string; issues: string[] }> = []
    const now = new Date()

    for (const article of articles) {
      const articleIssues: string[] = []
      
      if (!article.moderationStatus || article.moderationStatus === 'rejected') {
        articleIssues.push(`moderationStatus is '${article.moderationStatus || 'null'}' - should be 'pending'`)
      }

      const activePurchases = article.purchases.filter(p => p.status !== 'cancelled')
      if (activePurchases.length > 0) {
        articleIssues.push(`Has ${activePurchases.length} active purchase(s)`)
      }

      if (article.isAuction && article.auctionEnd && new Date(article.auctionEnd) <= now) {
        if (activePurchases.length === 0) {
          articleIssues.push(`Auction expired on ${article.auctionEnd.toISOString()} without purchase`)
        }
      }

      if (articleIssues.length > 0) {
        issues.push({
          id: article.id,
          title: article.title,
          issues: articleIssues,
        })
      }
    }

    return NextResponse.json({
      searchTerm,
      foundArticles: articles.length,
      articlesWithIssues: issues.length,
      issues,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error checking articles',
      message: error.message,
    }, {
      status: 500,
    })
  }
}

