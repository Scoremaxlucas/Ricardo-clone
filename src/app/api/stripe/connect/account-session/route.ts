import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSwissPostalCode } from '@/lib/profilePolicy'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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
      console.log(`[connect/account-session] Prefilled account ${accountId}`)
    }
  } catch (error: any) {
    // Don't fail if prefill fails - account may already have data submitted
    console.log(`[connect/account-session] Could not prefill: ${error.message}`)
  }
}

/**
 * POST /api/stripe/connect/account-session
 * Creates an AccountSession for Stripe Connect embedded onboarding
 */
export async function POST(_request: NextRequest) {
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
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    let accountId = user.stripeConnectedAccountId

    // Create account if it doesn't exist
    if (!accountId) {
      console.log(`[connect/account-session] Creating new account for user ${userId}`)

      // Build address data
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
          mcc: '5999',
          url: 'https://helvenda.ch',
        },
        metadata: {
          userId: userId,
          platform: 'helvenda',
        },
      })

      accountId = account.id

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectedAccountId: accountId,
          connectOnboardingStatus: 'NOT_STARTED',
          payoutsEnabled: false,
          chargesEnabled: false,
          stripeOnboardingComplete: false,
        },
      })

      console.log(`[connect/account-session] Created account ${accountId}`)
    } else {
      // Prefill existing account with latest data
      await prefillStripeAccount(accountId, user)
    }

    // Create AccountSession for embedded onboarding
    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
      },
    })

    console.log(`[connect/account-session] Created session for account ${accountId}`)

    return NextResponse.json({
      clientSecret: accountSession.client_secret,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error('[connect/account-session] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Session', error: error.message },
      { status: 500 }
    )
  }
}
