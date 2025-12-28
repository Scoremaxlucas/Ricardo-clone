import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const results: Record<string, unknown> = {
    requestedId: id,
    timestamp: new Date().toISOString(),
  }

  try {
    // Test 1: Find by ID
    const byId = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        articleNumber: true,
        moderationStatus: true,
      },
    })
    results.byId = byId

    // Test 2: Find by articleNumber (if numeric)
    if (/^\d+$/.test(id)) {
      const byArticleNumber = await prisma.watch.findUnique({
        where: { articleNumber: parseInt(id) },
        select: {
          id: true,
          title: true,
          articleNumber: true,
          moderationStatus: true,
        },
      })
      results.byArticleNumber = byArticleNumber
    }

    // Test 3: Find first (to verify DB works)
    const firstWatch = await prisma.watch.findFirst({
      select: {
        id: true,
        title: true,
        articleNumber: true,
      },
    })
    results.firstWatch = firstWatch

    // Test 4: Count all
    const totalCount = await prisma.watch.count()
    results.totalCount = totalCount

    results.success = true
    return NextResponse.json(results)
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    results.success = false
    results.error = err.message
    results.errorCode = err.code
    return NextResponse.json(results, { status: 500 })
  }
}
