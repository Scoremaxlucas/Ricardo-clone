'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

// Generate or retrieve a persistent session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('helvenda_sid')
  if (!sid) {
    sid =
      'sid_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 10)
    localStorage.setItem('helvenda_sid', sid)
  }
  // Rotate session after 30 min of inactivity
  const lastActivity = localStorage.getItem('helvenda_last_activity')
  const now = Date.now()
  if (lastActivity && now - parseInt(lastActivity) > 30 * 60 * 1000) {
    sid =
      'sid_' +
      now.toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 10)
    localStorage.setItem('helvenda_sid', sid)
  }
  localStorage.setItem('helvenda_last_activity', now.toString())
  return sid
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const pageEnteredAt = useRef<number>(Date.now())
  const lastTrackedPath = useRef<string>('')

  const track = useCallback(
    async (
      type: 'pageview' | 'duration' | 'event',
      extra?: Record<string, unknown>
    ) => {
      try {
        const sid = getSessionId()
        if (!sid) return

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: type === 'pageview' ? undefined : type,
            path: pathname,
            referrer: document.referrer || null,
            sessionId: sid,
            userId: (session?.user as { id?: string })?.id || null,
            screenWidth: window.screen?.width || null,
            ...extra,
          }),
          // Use keepalive for beforeunload events
          keepalive: true,
        })
      } catch {
        // Silently ignore tracking errors
      }
    },
    [pathname, session]
  )

  // Track page view on route change
  useEffect(() => {
    if (pathname === lastTrackedPath.current) return
    lastTrackedPath.current = pathname
    pageEnteredAt.current = Date.now()
    track('pageview')
  }, [pathname, track])

  // Track duration on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - pageEnteredAt.current) / 1000)
      if (duration > 0 && duration < 3600) {
        track('duration', { duration })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Also send duration when navigating away within the app
      const duration = Math.round((Date.now() - pageEnteredAt.current) / 1000)
      if (duration > 0 && duration < 3600) {
        track('duration', { duration })
      }
    }
  }, [pathname, track])

  return null
}

// Helper function to track custom events from anywhere
export function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  const sid = getSessionId()
  if (!sid) return

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'event',
      eventName,
      path: window.location.pathname,
      sessionId: sid,
      metadata,
    }),
  }).catch(() => {})
}
