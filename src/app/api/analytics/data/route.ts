import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check admin auth
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, all

  // Calculate date range
  const now = new Date()
  let startDate: Date
  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date('2020-01-01')
  }

  try {
    // Fetch all page views in the period
    const pageViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    })

    // Fetch analytics events in the period
    const events = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    })

    // === COMPUTE METRICS ===

    // Total page views
    const totalPageViews = pageViews.length

    // Unique visitors (unique sessionIds)
    const uniqueSessions = new Set(pageViews.map((pv) => pv.sessionId))
    const uniqueVisitors = uniqueSessions.size

    // Unique logged-in users
    const uniqueUsers = new Set(
      pageViews.filter((pv) => pv.userId).map((pv) => pv.userId)
    ).size

    // Average session duration
    const durationsPerSession: Record<string, number> = {}
    for (const pv of pageViews) {
      if (pv.duration && pv.duration > 0) {
        durationsPerSession[pv.sessionId] =
          (durationsPerSession[pv.sessionId] || 0) + pv.duration
      }
    }
    const sessionDurations = Object.values(durationsPerSession)
    const avgSessionDuration =
      sessionDurations.length > 0
        ? Math.round(
            sessionDurations.reduce((a, b) => a + b, 0) /
              sessionDurations.length
          )
        : 0

    // Pages per session
    const pagesPerSession: Record<string, number> = {}
    for (const pv of pageViews) {
      pagesPerSession[pv.sessionId] =
        (pagesPerSession[pv.sessionId] || 0) + 1
    }
    const avgPagesPerSession =
      uniqueVisitors > 0
        ? (totalPageViews / uniqueVisitors).toFixed(1)
        : '0'

    // Bounce rate (sessions with only 1 page view)
    const singlePageSessions = Object.values(pagesPerSession).filter(
      (c) => c === 1
    ).length
    const bounceRate =
      uniqueVisitors > 0
        ? ((singlePageSessions / uniqueVisitors) * 100).toFixed(1)
        : '0'

    // === PAGE VIEWS OVER TIME (daily) ===
    const viewsByDay: Record<string, { views: number; visitors: Set<string> }> =
      {}
    for (const pv of pageViews) {
      const day = pv.createdAt.toISOString().split('T')[0]
      if (!viewsByDay[day]) viewsByDay[day] = { views: 0, visitors: new Set() }
      viewsByDay[day].views++
      viewsByDay[day].visitors.add(pv.sessionId)
    }
    const viewsOverTime = Object.entries(viewsByDay)
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // === TOP PAGES ===
    const pageCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20)

    // === TOP REFERRERS ===
    const referrerCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      if (pv.referrer) {
        try {
          const url = new URL(pv.referrer)
          const host = url.hostname
          referrerCounts[host] = (referrerCounts[host] || 0) + 1
        } catch {
          referrerCounts[pv.referrer] =
            (referrerCounts[pv.referrer] || 0) + 1
        }
      } else {
        referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1
      }
    }
    const topReferrers = Object.entries(referrerCounts)
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15)

    // === DEVICE BREAKDOWN ===
    const deviceCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      const d = pv.device || 'unknown'
      deviceCounts[d] = (deviceCounts[d] || 0) + 1
    }
    const devices = Object.entries(deviceCounts).map(([name, value]) => ({
      name,
      value,
    }))

    // === BROWSER BREAKDOWN ===
    const browserCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      const b = pv.browser || 'unknown'
      browserCounts[b] = (browserCounts[b] || 0) + 1
    }
    const browsers = Object.entries(browserCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // === OS BREAKDOWN ===
    const osCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      const o = pv.os || 'unknown'
      osCounts[o] = (osCounts[o] || 0) + 1
    }
    const operatingSystems = Object.entries(osCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // === COUNTRY BREAKDOWN ===
    const countryCounts: Record<string, number> = {}
    for (const pv of pageViews) {
      const c = pv.country || 'Unknown'
      countryCounts[c] = (countryCounts[c] || 0) + 1
    }
    const countries = Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20)

    // === HOURLY DISTRIBUTION ===
    const hourlyViews = new Array(24).fill(0)
    for (const pv of pageViews) {
      hourlyViews[pv.createdAt.getHours()]++
    }
    const hourlyDistribution = hourlyViews.map((views, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      views,
    }))

    // === EVENTS BREAKDOWN ===
    const eventCounts: Record<string, number> = {}
    for (const ev of events) {
      eventCounts[ev.name] = (eventCounts[ev.name] || 0) + 1
    }
    const topEvents = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // === REAL-TIME (last 30 minutes) ===
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const recentViews = pageViews.filter(
      (pv) => pv.createdAt >= thirtyMinAgo
    )
    const activeNow = new Set(recentViews.map((pv) => pv.sessionId)).size

    // === DETAILED VISITOR SESSIONS ===
    // Group page views by session and enrich with user data
    const sessionMap: Record<
      string,
      {
        sessionId: string
        userId: string | null
        pages: Array<{ path: string; time: string; duration: number | null }>
        device: string | null
        browser: string | null
        os: string | null
        country: string | null
        city: string | null
        referrer: string | null
        firstSeen: Date
        lastSeen: Date
        totalDuration: number
      }
    > = {}

    for (const pv of pageViews) {
      if (!sessionMap[pv.sessionId]) {
        sessionMap[pv.sessionId] = {
          sessionId: pv.sessionId,
          userId: pv.userId,
          pages: [],
          device: pv.device,
          browser: pv.browser,
          os: pv.os,
          country: pv.country,
          city: pv.city,
          referrer: pv.referrer,
          firstSeen: pv.createdAt,
          lastSeen: pv.createdAt,
          totalDuration: 0,
        }
      }
      const sess = sessionMap[pv.sessionId]
      sess.pages.push({
        path: pv.path,
        time: pv.createdAt.toISOString(),
        duration: pv.duration,
      })
      if (pv.userId) sess.userId = pv.userId
      if (pv.createdAt < sess.firstSeen) sess.firstSeen = pv.createdAt
      if (pv.createdAt > sess.lastSeen) sess.lastSeen = pv.createdAt
      if (pv.duration) sess.totalDuration += pv.duration
    }

    // Get user details for logged-in sessions
    const userIds = [
      ...new Set(
        Object.values(sessionMap)
          .map((s) => s.userId)
          .filter(Boolean)
      ),
    ] as string[]

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              nickname: true,
              image: true,
              createdAt: true,
              lastLoginAt: true,
            },
          })
        : []
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

    // Build sorted visitor list (most recent first), limit to 50
    const visitors = Object.values(sessionMap)
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 50)
      .map((sess) => {
        const user = sess.userId ? userMap[sess.userId] : null
        return {
          sessionId: sess.sessionId.substring(0, 12) + '...',
          isLoggedIn: !!sess.userId,
          user: user
            ? {
                name:
                  user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.name || user.nickname || null,
                email: user.email,
                image: user.image,
                memberSince: user.createdAt.toISOString(),
              }
            : null,
          device: sess.device,
          browser: sess.browser,
          os: sess.os,
          country: sess.country,
          city: sess.city,
          referrer: sess.referrer,
          firstSeen: sess.firstSeen.toISOString(),
          lastSeen: sess.lastSeen.toISOString(),
          pageCount: sess.pages.length,
          totalDuration: sess.totalDuration,
          isActive:
            now.getTime() - sess.lastSeen.getTime() < 30 * 60 * 1000,
          pages: sess.pages.sort(
            (a, b) =>
              new Date(a.time).getTime() - new Date(b.time).getTime()
          ),
        }
      })

    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        uniqueUsers,
        avgSessionDuration,
        avgPagesPerSession,
        bounceRate,
        activeNow,
      },
      viewsOverTime,
      topPages,
      topReferrers,
      devices,
      browsers,
      operatingSystems,
      countries,
      hourlyDistribution,
      topEvents,
      visitors,
    })
  } catch (error) {
    console.error('Analytics data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
