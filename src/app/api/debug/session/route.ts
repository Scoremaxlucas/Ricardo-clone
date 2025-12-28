import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('[debug/session] Testing session...')

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  try {
    // Get session
    const session = await getServerSession(authOptions)
    results.hasSession = !!session
    results.sessionUser = session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isAdmin: session.user.isAdmin,
        }
      : null

    if (!session?.user?.id) {
      results.message = 'No session found - user not logged in'
      return NextResponse.json(results)
    }

    // Check user in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isBlocked: true,
      },
    })

    results.dbUser = dbUser
    results.isAdminMatch = session.user.isAdmin === dbUser?.isAdmin

    // Try to fetch watches for this user
    const userWatches = await prisma.watch.findMany({
      where: { sellerId: session.user.id },
      select: {
        id: true,
        title: true,
        articleNumber: true,
      },
      take: 5,
    })

    results.userWatchCount = userWatches.length
    results.userWatches = userWatches

    // Try simple admin query
    if (dbUser?.isAdmin) {
      const allWatchesCount = await prisma.watch.count()
      results.totalWatchesInDb = allWatchesCount

      // Try the problematic query
      try {
        const testWatch = await prisma.watch.findFirst({
          include: {
            seller: { select: { id: true, email: true } },
            purchases: { select: { id: true, status: true } },
            categories: { include: { category: true } },
            favorites: { select: { id: true } },
          },
        })
        results.testQuerySuccess = true
        results.testWatch = testWatch
          ? {
              id: testWatch.id,
              title: testWatch.title?.substring(0, 30),
              hasSeller: !!testWatch.seller,
              purchaseCount: testWatch.purchases?.length || 0,
              categoryCount: testWatch.categories?.length || 0,
            }
          : null
      } catch (queryError: unknown) {
        const err = queryError as Error
        results.testQuerySuccess = false
        results.testQueryError = err.message
      }

      // Try views and reports (might not exist)
      try {
        const viewCount = await prisma.watchView.count()
        results.viewTableExists = true
        results.viewCount = viewCount
      } catch {
        results.viewTableExists = false
      }

      try {
        const reportCount = await prisma.report.count()
        results.reportTableExists = true
        results.reportCount = reportCount
      } catch {
        results.reportTableExists = false
      }
    }

    results.success = true
    return NextResponse.json(results)
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    console.error('[debug/session] Error:', err.message)
    results.success = false
    results.error = err.message
    results.errorCode = err.code
    return NextResponse.json(results, { status: 500 })
  }
}
