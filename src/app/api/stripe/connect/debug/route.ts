import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/stripe/connect/debug
 * Debug endpoint to test Stripe Connect setup
 */
export async function GET(request: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    debug.checks.auth = {
      hasSession: !!session,
      userId: session?.user?.id || null,
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          ...debug,
          message: 'Nicht autorisiert',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check database connection
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      debug.checks.database = {
        connected: true,
        userFound: !!user,
        hasStripeAccount: !!user?.stripeConnectedAccountId,
        stripeAccountId: user?.stripeConnectedAccountId || null,
        connectOnboardingStatus: (user as any)?.connectOnboardingStatus || 'undefined',
        payoutsEnabled: (user as any)?.payoutsEnabled !== undefined ? (user as any).payoutsEnabled : 'undefined',
      }
    } catch (dbError: any) {
      debug.errors.push({ type: 'database', message: dbError.message })
      debug.checks.database = { connected: false, error: dbError.message }
    }

    // Check Stripe configuration
    debug.checks.stripe = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
      keyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    }

    // Test Stripe API if account exists
    if (debug.checks.database?.hasStripeAccount) {
      try {
        const account = await stripe.accounts.retrieve(
          debug.checks.database.stripeAccountId!
        )
        debug.checks.stripe.account = {
          exists: true,
          id: account.id,
          type: account.type,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        }
      } catch (stripeError: any) {
        debug.errors.push({
          type: 'stripe_account',
          message: stripeError.message,
          code: stripeError.code,
        })
      }
    }

    // Check URLs
    debug.checks.urls = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      computedBaseUrl: (() => {
        let baseUrl = process.env.NEXTAUTH_URL || ''
        if (!baseUrl && process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`
        }
        if (!baseUrl) {
          const url = new URL(request.url)
          baseUrl = `${url.protocol}//${url.host}`
        }
        return baseUrl || 'http://localhost:3000'
      })(),
    }

    return NextResponse.json({
      ...debug,
      success: debug.errors.length === 0,
    })
  } catch (error: any) {
    debug.errors.push({
      type: 'general',
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        ...debug,
        success: false,
      },
      { status: 500 }
    )
  }
}
