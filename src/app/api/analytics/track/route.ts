import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
    const { path, referrer, sessionId, userId, screenWidth, duration, type } =
      body

    if (!path || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const ua = request.headers.get('user-agent')
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
          sessionId,
          userId: userId || null,
          path,
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (type === 'duration') {
      // Update duration of an existing page view
      const existing = await prisma.pageView.findFirst({
        where: { sessionId, path },
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
        path,
        referrer: referrer || null,
        userAgent: ua || null,
        sessionId,
        userId: userId || null,
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
