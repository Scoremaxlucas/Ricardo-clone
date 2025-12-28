import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export type PayoutStatus = 'not_started' | 'pending' | 'enabled'

export interface ConnectStatusResponse {
  status: PayoutStatus
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    disabled_reason: string | null
  }
  accountId?: string
}

/**
 * GET /api/stripe/connect/status
 * Returns the current Stripe Connect status for the authenticated user
 */
export async function GET() {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Load user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // If no Stripe account exists
    if (!user.stripeConnectedAccountId) {
      const response: ConnectStatusResponse = {
        status: 'not_started',
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      }
      return NextResponse.json(response)
    }

    // Retrieve account from Stripe
    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId)

      // Determine status
      let status: PayoutStatus = 'pending'
      if (account.payouts_enabled && account.details_submitted) {
        status = 'enabled'
      } else if (!account.details_submitted) {
        status = 'pending'
      }

      // Update database if status changed
      const shouldUpdateDb =
        user.stripeOnboardingComplete !== account.details_submitted ||
        user.payoutsEnabled !== account.payouts_enabled

      if (shouldUpdateDb) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeOnboardingComplete: account.details_submitted ?? false,
            payoutsEnabled: account.payouts_enabled ?? false,
          },
        })
      }

      const response: ConnectStatusResponse = {
        status,
        payoutsEnabled: account.payouts_enabled ?? false,
        chargesEnabled: account.charges_enabled ?? false,
        detailsSubmitted: account.details_submitted ?? false,
        requirements: account.requirements
          ? {
              currently_due: account.requirements.currently_due || [],
              eventually_due: account.requirements.eventually_due || [],
              past_due: account.requirements.past_due || [],
              disabled_reason: account.requirements.disabled_reason ?? null,
            }
          : undefined,
        accountId: user.stripeConnectedAccountId,
      }

      return NextResponse.json(response)
    } catch (stripeError: any) {
      console.error('[connect/status] Stripe error:', stripeError)

      // Account may have been deleted
      if (stripeError.code === 'account_invalid') {
        // Clear the invalid account ID
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeConnectedAccountId: null,
            stripeOnboardingComplete: false,
            payoutsEnabled: false,
          },
        })

        const response: ConnectStatusResponse = {
          status: 'not_started',
          payoutsEnabled: false,
          chargesEnabled: false,
          detailsSubmitted: false,
        }
        return NextResponse.json(response)
      }

      throw stripeError
    }
  } catch (error: any) {
    console.error('[connect/status] Error:', error)

    return NextResponse.json(
      {
        message: 'Fehler beim Laden des Status',
        error: error.message || 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
