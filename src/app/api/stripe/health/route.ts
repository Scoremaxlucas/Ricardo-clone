import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe-server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint for Stripe integration
 * Useful for monitoring and Cloudflare health checks
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; timestamp: string }> =
    {}

  // Check 1: Stripe API Key
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      checks.stripe_api_key = {
        status: 'error',
        message: 'STRIPE_SECRET_KEY not set',
        timestamp: new Date().toISOString(),
      }
    } else {
      // Try to make a minimal API call to verify key works
      try {
        await stripe.balance.retrieve()
        checks.stripe_api_key = {
          status: 'ok',
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        checks.stripe_api_key = {
          status: 'error',
          message: `Stripe API error: ${error.message}`,
          timestamp: new Date().toISOString(),
        }
      }
    }
  } catch (error: any) {
    checks.stripe_api_key = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }
  }

  // Check 2: Webhook Secret
  if (!STRIPE_WEBHOOK_SECRET) {
    checks.webhook_secret = {
      status: 'error',
      message: 'STRIPE_WEBHOOK_SECRET not set',
      timestamp: new Date().toISOString(),
    }
  } else {
    checks.webhook_secret = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }

  // Check 3: Database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    checks.database = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }
  }

  // Check 4: Environment
  checks.environment = {
    status: 'ok',
    message: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }

  // Determine overall status
  const allOk = Object.values(checks).every(check => check.status === 'ok')
  const status = allOk ? 'healthy' : 'degraded'

  return NextResponse.json(
    {
      status,
      service: 'stripe-integration',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'stripe',
      },
    }
  )
}
