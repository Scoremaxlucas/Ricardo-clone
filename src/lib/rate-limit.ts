import { prisma } from './prisma'

interface RateLimitOptions {
  identifier: string
  limit: number
  window: number // in seconds
}

/**
 * Rate limiting utility with database-backed tracking
 * Uses sliding window algorithm
 */
export async function checkRateLimit({
  identifier,
  limit,
  window,
}: RateLimitOptions): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - window * 1000)

  try {
    // Count requests in the current window
    const count = await prisma.rateLimit.count({
      where: {
        identifier,
        createdAt: {
          gte: windowStart,
        },
      },
    })

    const remaining = Math.max(0, limit - count)
    const allowed = count < limit

    // Record this request
    if (allowed) {
      await prisma.rateLimit.create({
        data: {
          identifier,
          createdAt: now,
        },
      }).catch(() => {
        // Ignore errors - rate limiting should not break the app
      })
    }

    // Clean up old entries (older than window)
    await prisma.rateLimit
      .deleteMany({
        where: {
          identifier,
          createdAt: {
            lt: windowStart,
          },
        },
      })
      .catch(() => {
        // Ignore cleanup errors
      })

    const resetAt = new Date(now.getTime() + window * 1000)

    return { allowed, remaining, resetAt }
  } catch (error) {
    // On error, allow the request (fail open)
    console.error('[rate-limit] Error checking rate limit:', error)
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now.getTime() + window * 1000),
    }
  }
}

/**
 * Stripe webhook rate limiting
 * Stripe recommends handling at least 1000 events/second
 * We set a conservative limit of 100 events per 10 seconds per IP
 */
export async function checkStripeWebhookRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  return checkRateLimit({
    identifier: `stripe-webhook:${ip}`,
    limit: 100, // 100 requests
    window: 10, // per 10 seconds
  })
}

/**
 * Stripe API rate limiting (for our API calls to Stripe)
 * Stripe allows 100 requests per second per API key
 */
export async function checkStripeAPIRateLimit(
  apiKey: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const keyHash = apiKey.substring(0, 10) // Use first 10 chars as identifier
  return checkRateLimit({
    identifier: `stripe-api:${keyHash}`,
    limit: 90, // Conservative: 90 requests
    window: 1, // per second
  })
}
