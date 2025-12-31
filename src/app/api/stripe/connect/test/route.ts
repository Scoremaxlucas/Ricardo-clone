import { shouldShowDetailedErrors } from "@/lib/env"
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/stripe/connect/test
 * Test endpoint to check configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Lade User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe Felder
    const connectOnboardingStatus = (user as any).connectOnboardingStatus
    const payoutsEnabled = (user as any).payoutsEnabled

    // Prüfe Stripe Konfiguration
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
    const stripeKeyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing'

    // Prüfe URLs
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const vercelUrl = process.env.VERCEL_URL

    let baseUrl = nextAuthUrl || ''
    if (!baseUrl && vercelUrl) {
      baseUrl = `https://${vercelUrl}`
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000'
    }

    // Test Stripe API
    let stripeTest = 'not tested'
    try {
      if (user.stripeConnectedAccountId) {
        const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId)
        stripeTest = `success - account ${account.id} exists`
      } else {
        stripeTest = 'no account yet'
      }
    } catch (stripeError: any) {
      stripeTest = `error: ${stripeError.message}`
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        stripeConnectedAccountId: user.stripeConnectedAccountId || null,
        stripeOnboardingComplete: user.stripeOnboardingComplete,
        connectOnboardingStatus: connectOnboardingStatus || 'undefined',
        payoutsEnabled: payoutsEnabled !== undefined ? payoutsEnabled : 'undefined',
      },
      config: {
        hasStripeKey,
        stripeKeyPrefix,
        nextAuthUrl: nextAuthUrl || 'not set',
        vercelUrl: vercelUrl || 'not set',
        baseUrl,
      },
      stripeTest,
    })
  } catch (error: any) {
    console.error('[connect/test] Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: shouldShowDetailedErrors() ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
