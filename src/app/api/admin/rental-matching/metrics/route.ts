import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type StoredMetric = {
  mode?: 'all' | 'match'
  isLoggedIn?: boolean
  needsPreferences?: boolean
  rolloutBlocked?: boolean
  rolloutReason?: string
  totalResults?: number
  matchedResults?: number
  scoreBuckets?: Record<string, number>
  avgScore?: number | null
  topScore?: number | null
}

function parsePeriod(period: string | null): Date {
  const now = Date.now()
  if (period === '24h') return new Date(now - 24 * 60 * 60 * 1000)
  if (period === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000)
  if (period === '90d') return new Date(now - 90 * 24 * 60 * 60 * 1000)
  return new Date(now - 7 * 24 * 60 * 60 * 1000)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const since = parsePeriod(searchParams.get('period'))

  const rows = await prisma.analyticsEvent.findMany({
    where: {
      name: 'rental_match_mode_view',
      createdAt: { gte: since },
    },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const summary = {
    totalViews: 0,
    allModeViews: 0,
    matchModeViews: 0,
    rolloutBlockedInMatchMode: 0,
    notLoggedInInMatchMode: 0,
    missingPreferencesInMatchMode: 0,
    matchedModeWithResults: 0,
    matchedModeWithoutResults: 0,
    averageMatchRate: 0,
    scoreBuckets: { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 } as Record<string, number>,
  }

  let matchRequestsForRate = 0
  let matchRateSum = 0

  for (const row of rows) {
    summary.totalViews++
    let metadata: StoredMetric = {}
    if (row.metadata) {
      try {
        metadata = JSON.parse(row.metadata) as StoredMetric
      } catch {
        metadata = {}
      }
    }

    if (metadata.mode === 'all') {
      summary.allModeViews++
      continue
    }

    summary.matchModeViews++
    if (metadata.rolloutBlocked) summary.rolloutBlockedInMatchMode++
    if (!metadata.isLoggedIn) summary.notLoggedInInMatchMode++
    if (metadata.needsPreferences) summary.missingPreferencesInMatchMode++

    const totalResults = metadata.totalResults ?? 0
    const matchedResults = metadata.matchedResults ?? 0
    if (matchedResults > 0) summary.matchedModeWithResults++
    else summary.matchedModeWithoutResults++

    if (totalResults > 0) {
      matchRequestsForRate++
      matchRateSum += (matchedResults / totalResults) * 100
    }

    const buckets = metadata.scoreBuckets || {}
    for (const key of ['0-49', '50-69', '70-84', '85-100']) {
      summary.scoreBuckets[key] += Number(buckets[key] || 0)
    }
  }

  summary.averageMatchRate =
    matchRequestsForRate > 0 ? Math.round((matchRateSum / matchRequestsForRate) * 10) / 10 : 0

  return NextResponse.json({
    periodSince: since.toISOString(),
    summary,
    sampleSize: rows.length,
  })
}
