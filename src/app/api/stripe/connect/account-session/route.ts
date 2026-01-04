import { authOptions } from '@/lib/auth'
import { getUserMainAddressData, validateSwissPostalCode } from '@/lib/address'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Helper function to prefill Stripe account with Helvenda user data
 * Uses UserAddress table with fallback to legacy fields
 */
async function prefillStripeAccount(
  accountId: string,
  userId: string,
  user: {
    email: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
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

    // Get address from UserAddress table (with legacy fallback)
    const address = await getUserMainAddressData(userId)

    // Build address if we have valid postal code
    if (address.postalCode && validateSwissPostalCode(address.postalCode)) {
      individual.address = {
        country: 'CH',
        postal_code: address.postalCode.trim(),
      }
      if (address.street || address.streetNumber) {
        individual.address.line1 = [address.street, address.streetNumber].filter(Boolean).join(' ')
      }
      if (address.city) {
        individual.address.city = address.city
      }
    }

    if (Object.keys(individual).length > 0) {
      updateParams.individual = individual
    }

    // Only update if we have something to update
    if (Object.keys(updateParams).length > 0) {
      await stripe.accounts.update(accountId, updateParams)
      console.log(`[connect/account-session] Prefilled account ${accountId} (address source: ${address.source || 'none'})`)
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

    // Load user with profile data (address from UserAddress table)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        stripeConnectedAccountId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Get address from UserAddress table (with legacy fallback)
    const userAddress = await getUserMainAddressData(userId)

    let accountId = user.stripeConnectedAccountId

    // Create account if it doesn't exist
    if (!accountId) {
      console.log(`[connect/account-session] Creating new account for user ${userId}`)

      // Build address data from UserAddress
      const addressData: any = { country: 'CH' }
      if (userAddress.postalCode && validateSwissPostalCode(userAddress.postalCode)) {
        addressData.postal_code = userAddress.postalCode.trim()
        if (userAddress.street || userAddress.streetNumber) {
          addressData.line1 = [userAddress.street, userAddress.streetNumber].filter(Boolean).join(' ')
        }
        if (userAddress.city) {
          addressData.city = userAddress.city
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

      console.log(`[connect/account-session] Created account ${accountId} (address source: ${userAddress.source || 'none'})`)
    } else {
      // Prefill existing account with latest data
      await prefillStripeAccount(accountId, userId, user)
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
