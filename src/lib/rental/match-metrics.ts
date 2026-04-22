import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

type MatchMetricsPayload = {
  mode: 'all' | 'match'
  isLoggedIn: boolean
  needsPreferences: boolean
  rolloutBlocked?: boolean
  rolloutReason?: string
  totalResults: number
  matchedResults: number
  scoreValues?: number[]
}

function toBucket(score: number): '0-49' | '50-69' | '70-84' | '85-100' {
  if (score < 50) return '0-49'
  if (score < 70) return '50-69'
  if (score < 85) return '70-84'
  return '85-100'
}

function buildSessionId(request: NextRequest, userId: string | null): string {
  if (userId) return `u:${userId}`
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const day = new Date().toISOString().slice(0, 10)
  return `anon:${createHash('sha1').update(`${ip}|${ua}|${day}`).digest('hex').slice(0, 24)}`
}

export async function trackRentalMatchMetricsEvent(
  request: NextRequest,
  userId: string | null,
  payload: MatchMetricsPayload
): Promise<void> {
  const buckets = { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 }
  const scores = payload.scoreValues ?? []
  for (const s of scores) {
    buckets[toBucket(s)]++
  }
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const topScore = scores.length > 0 ? Math.max(...scores) : null

  try {
    await prisma.analyticsEvent.create({
      data: {
        name: 'rental_match_mode_view',
        sessionId: buildSessionId(request, userId),
        userId,
        path: '/wohnungen',
        metadata: JSON.stringify({
          mode: payload.mode,
          isLoggedIn: payload.isLoggedIn,
          needsPreferences: payload.needsPreferences,
          rolloutBlocked: Boolean(payload.rolloutBlocked),
          rolloutReason: payload.rolloutReason ?? null,
          totalResults: payload.totalResults,
          matchedResults: payload.matchedResults,
          scoreBuckets: buckets,
          avgScore,
          topScore,
        }),
      },
    })
  } catch (error) {
    console.error('[rental-match-metrics]', error)
  }
}
