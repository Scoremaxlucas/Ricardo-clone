import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSwissPostalCode } from '@/lib/profilePolicy'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Helper function to determine connect status from Stripe account
 */
function determineConnectStatus(account: {
  requirements?: {
    currently_due?: string[] | null
    pending_verification?: string[] | null
    past_due?: string[] | null
  } | null
  payouts_enabled?: boolean | null
  details_submitted?: boolean | null
}): 'NOT_STARTED' | 'IN_PROGRESS' | 'ACTION_REQUIRED' | 'VERIFIED' {
  const currentlyDue = account.requirements?.currently_due || []
  const pendingVerification = account.requirements?.pending_verification || []
  const pastDue = account.requirements?.past_due || []

  // If there are past_due or currently_due items, action is required
  if (pastDue.length > 0 || currentlyDue.length > 0) {
    return 'ACTION_REQUIRED'
  }

  // If there are pending verifications, it's in progress
  if (pendingVerification.length > 0) {
    return 'IN_PROGRESS'
  }

  // If payouts are enabled and details submitted, it's verified
  if (account.payouts_enabled && account.details_submitted) {
    return 'VERIFIED'
  }

  // If details were submitted but payouts not yet enabled
  if (account.details_submitted) {
    return 'IN_PROGRESS'
  }

  return 'NOT_STARTED'
}

/**
 * Helper function to prefill Stripe account with Helvenda user data
 */
async function prefillStripeAccount(
  accountId: string,
  user: {
    email: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    street: string | null
    streetNumber: string | null
    postalCode: string | null
    city: string | null
  }
) {
  try {
    const updateParams: any = {}

    // Update email if available
    if (user.email) {
      updateParams.email = user.email
    }

    // Build individual data
    const individual: any = {}

    if (user.email) individual.email = user.email
    if (user.phone) individual.phone = user.phone
    if (user.firstName) individual.first_name = user.firstName
    if (user.lastName) individual.last_name = user.lastName

    // Build address if we have valid postal code
    if (user.postalCode && validateSwissPostalCode(user.postalCode)) {
      individual.address = {
        country: 'CH',
        postal_code: user.postalCode.trim(),
      }
      if (user.street || user.streetNumber) {
        individual.address.line1 = [user.street, user.streetNumber].filter(Boolean).join(' ')
      }
      if (user.city) {
        individual.address.city = user.city
      }
    }

    if (Object.keys(individual).length > 0) {
      updateParams.individual = individual
    }

    // Only update if we have something to update
    if (Object.keys(updateParams).length > 0) {
      await stripe.accounts.update(accountId, updateParams)
      console.log(`[connect/account] Prefilled account ${accountId} with user data`)
    }
  } catch (error: any) {
    // Don't fail if prefill fails - account may already have data
    console.log(`[connect/account] Could not prefill account: ${error.message}`)
  }
}

/**
 * POST /api/stripe/connect/account
 * Creates or retrieves a Stripe Connect account for the authenticated user
 * Prefills account with available Helvenda user data
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Load user with profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        stripeConnectedAccountId: true,
        connectOnboardingStatus: true,
        payoutsEnabled: true,
        chargesEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    let accountId = user.stripeConnectedAccountId

    // If account exists, retrieve and update status
    if (accountId) {
      try {
        const account = await stripe.accounts.retrieve(accountId)

        // Prefill with latest data
        await prefillStripeAccount(accountId, user)

        // Determine and update status
        const status = determineConnectStatus(account)
        const requirements = account.requirements
          ? {
              currently_due: account.requirements.currently_due || [],
              eventually_due: account.requirements.eventually_due || [],
              past_due: account.requirements.past_due || [],
              pending_verification: account.requirements.pending_verification || [],
              disabled_reason: account.requirements.disabled_reason ?? null,
            }
          : undefined

        await prisma.user.update({
          where: { id: userId },
          data: {
            connectOnboardingStatus: status,
            payoutsEnabled: account.payouts_enabled ?? false,
            chargesEnabled: account.charges_enabled ?? false,
            stripeOnboardingComplete: account.details_submitted ?? false,
            stripeRequirements: requirements,
          },
        })

        return NextResponse.json({
          accountId,
          status,
          payoutsEnabled: account.payouts_enabled ?? false,
          chargesEnabled: account.charges_enabled ?? false,
          detailsSubmitted: account.details_submitted ?? false,
          requirements,
        })
      } catch (stripeError: any) {
        // Account might be invalid, create a new one
        if (stripeError.code === 'account_invalid') {
          console.log(`[connect/account] Invalid account ${accountId}, creating new one`)
          accountId = null
        } else {
          throw stripeError
        }
      }
    }

    // Create new Express account
    console.log(`[connect/account] Creating new account for user ${userId}`)

    // Build address data for account creation
    const addressData: any = { country: 'CH' }
    if (user.postalCode && validateSwissPostalCode(user.postalCode)) {
      addressData.postal_code = user.postalCode.trim()
      if (user.street || user.streetNumber) {
        addressData.line1 = [user.street, user.streetNumber].filter(Boolean).join(' ')
      }
      if (user.city) {
        addressData.city = user.city
      }
    }

    const hasValidAddress = addressData.line1 || addressData.city

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CH',
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: user.firstName || undefined,
        last_name: user.lastName || undefined,
        email: user.email || undefined,
        phone: user.phone || undefined,
        address: hasValidAddress ? addressData : undefined,
      },
      business_profile: {
        mcc: '5999', // Misc Retail
        url: 'https://helvenda.ch',
      },
      metadata: {
        userId: userId,
        platform: 'helvenda',
      },
    })

    accountId = account.id

    // Save to database
    const status = determineConnectStatus(account)
    const requirements = account.requirements
      ? {
          currently_due: account.requirements.currently_due || [],
          eventually_due: account.requirements.eventually_due || [],
          past_due: account.requirements.past_due || [],
          pending_verification: account.requirements.pending_verification || [],
          disabled_reason: account.requirements.disabled_reason ?? null,
        }
      : undefined

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeConnectedAccountId: accountId,
        connectOnboardingStatus: status,
        payoutsEnabled: false,
        chargesEnabled: false,
        stripeOnboardingComplete: false,
        stripeRequirements: requirements,
      },
    })

    console.log(`[connect/account] Created account ${accountId} for user ${userId}`)

    return NextResponse.json({
      accountId,
      status,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      requirements,
    })
  } catch (error: any) {
    console.error('[connect/account] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Kontos', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/connect/account
 * Returns the current account status without creating one
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeConnectedAccountId: true,
        connectOnboardingStatus: true,
        payoutsEnabled: true,
        chargesEnabled: true,
        stripeOnboardingComplete: true,
        stripeRequirements: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (!user.stripeConnectedAccountId) {
      return NextResponse.json({
        accountId: null,
        status: 'NOT_STARTED',
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        requirements: null,
      })
    }

    return NextResponse.json({
      accountId: user.stripeConnectedAccountId,
      status: user.connectOnboardingStatus,
      payoutsEnabled: user.payoutsEnabled,
      chargesEnabled: user.chargesEnabled ?? false,
      detailsSubmitted: user.stripeOnboardingComplete,
      requirements: user.stripeRequirements,
    })
  } catch (error: any) {
    console.error('[connect/account] GET Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Kontostatus', error: error.message },
      { status: 500 }
    )
  }
}
