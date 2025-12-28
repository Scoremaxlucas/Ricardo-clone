import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('[debug/db] Testing database connection...')

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  }

  try {
    // Test 1: Simple query
    console.log('[debug/db] Test 1: Counting users...')
    const userCount = await prisma.user.count()
    results.userCount = userCount
    console.log('[debug/db] User count:', userCount)

    // Test 2: Count watches
    console.log('[debug/db] Test 2: Counting watches...')
    const watchCount = await prisma.watch.count()
    results.watchCount = watchCount
    console.log('[debug/db] Watch count:', watchCount)

    // Test 3: Fetch one watch
    console.log('[debug/db] Test 3: Fetching one watch...')
    const oneWatch = await prisma.watch.findFirst({
      select: {
        id: true,
        title: true,
        articleNumber: true,
        moderationStatus: true,
        createdAt: true,
      },
    })
    results.sampleWatch = oneWatch
      ? {
          id: oneWatch.id,
          title: oneWatch.title?.substring(0, 30),
          articleNumber: oneWatch.articleNumber,
          moderationStatus: oneWatch.moderationStatus,
        }
      : null
    console.log('[debug/db] Sample watch:', results.sampleWatch)

    results.success = true
    results.message = 'Database connection successful!'

    return NextResponse.json(results)
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    console.error('[debug/db] Database error:', err.message)
    console.error('[debug/db] Error stack:', err.stack)

    results.success = false
    results.error = err.message
    results.errorCode = err.code
    results.errorStack = err.stack?.split('\n').slice(0, 5).join('\n')

    return NextResponse.json(results, { status: 500 })
  }
}
