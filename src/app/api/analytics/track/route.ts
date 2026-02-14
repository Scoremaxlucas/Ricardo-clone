import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Check if user agent is a bot/crawler
function isBot(ua: string | null): boolean {
  if (!ua) return false
  return /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebook|twitter|whatsapp|telegram|preview|headlesschrome|vercel-screenshot|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i.test(
    ua
  )
}

// Parse user agent into device, browser, and OS
function parseUserAgent(ua: string | null) {
  if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' }

  // Device
  let device = 'desktop'
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile'
  }

  // Browser
  let browser = 'unknown'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE'

  // OS
  let os = 'unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('CrOS')) os = 'ChromeOS'

  return { device, browser, os }
}

// Track a page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, referrer, sessionId, screenWidth, duration, type } = body

    if (!path || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Input validation
    const pathStr = typeof path === 'string' ? path : String(path ?? '')
    const sessionIdStr = typeof sessionId === 'string' ? sessionId : String(sessionId ?? '')
    if (pathStr.length > 500) {
      return NextResponse.json(
        { error: 'path exceeds maximum length of 500 characters' },
        { status: 400 }
      )
    }
    if (sessionIdStr.length > 100) {
      return NextResponse.json(
        { error: 'sessionId exceeds maximum length of 100 characters' },
        { status: 400 }
      )
    }

    // Get userId from session only - never accept from client
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? null

    const ua = request.headers.get('user-agent')

    // Skip bots and crawlers
    if (isBot(ua)) {
      return NextResponse.json({ ok: true })
    }

    const { device, browser, os } = parseUserAgent(ua)

    // Get country from Vercel headers (available on Vercel deployments)
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      null
    const city = request.headers.get('x-vercel-ip-city') || null

    if (type === 'event') {
      // Track an analytics event
      await prisma.analyticsEvent.create({
        data: {
          name: body.eventName || 'unknown',
          sessionId: sessionIdStr,
          userId,
          path: pathStr,
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (type === 'duration') {
      // Update duration of an existing page view
      const existing = await prisma.pageView.findFirst({
        where: { sessionId: sessionIdStr, path: pathStr },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) {
        await prisma.pageView.update({
          where: { id: existing.id },
          data: { duration: duration || 0 },
        })
      }
      return NextResponse.json({ ok: true })
    }

    // Default: track page view
    await prisma.pageView.create({
      data: {
        path: pathStr,
        referrer: referrer || null,
        userAgent: ua || null,
        sessionId: sessionIdStr,
        userId,
        country,
        city,
        device,
        browser,
        os,
        screenWidth: screenWidth || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Don't break the user experience for analytics errors
    return NextResponse.json({ ok: true })
  }
}
