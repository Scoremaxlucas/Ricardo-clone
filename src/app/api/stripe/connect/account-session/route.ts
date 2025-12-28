import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSwissPostalCode } from '@/lib/profilePolicy'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

/**
 * POST /api/stripe/connect/account-session
 * Creates an AccountSession for Stripe Connect Embedded Onboarding
 * Used by the embedded onboarding component in the frontend
 */
export async function POST(_request: NextRequest) {
  try {
    // Verify Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[connect/account-session] STRIPE_SECRET_KEY missing!')
      return NextResponse.json({ message: 'Stripe ist nicht konfiguriert' }, { status: 500 })
    }

    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`[connect/account-session] Request from User ${userId}`)

    // Load user with all profile data for prefilling
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
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    let accountId = user.stripeConnectedAccountId

    // Create or get existing Stripe Connect account
    if (!accountId) {
      console.log(`[connect/account-session] Creating new account for User ${userId}`)

      // Build address data if available
      const addressData: {
        line1?: string
        city?: string
        postal_code?: string
        country: string
      } = { country: 'CH' }

      if (user.street || user.streetNumber) {
        addressData.line1 = [user.street, user.streetNumber].filter(Boolean).join(' ') || undefined
      }
      if (user.city) {
        addressData.city = user.city
      }
      if (user.postalCode && validateSwissPostalCode(user.postalCode)) {
        addressData.postal_code = user.postalCode.trim()
      }

      const hasValidAddress = (addressData.line1 || addressData.city) && addressData.postal_code

      // Create Express account with prefilled data
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
          prefilled: 'true',
        },
      })

      accountId = account.id

      // Save account ID to database
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectedAccountId: accountId,
          stripeOnboardingComplete: false,
          payoutsEnabled: false,
        },
      })

      console.log(`[connect/account-session] ✅ Account ${accountId} created`)
    } else {
      // Update existing account with latest profile data if possible
      console.log(`[connect/account-session] Using existing account ${accountId}`)

      try {
        // Try to update account with prefilled data
        const updateData: Stripe.AccountUpdateParams = {}

        // Only update individual fields if they have values
        if (user.email || user.phone || user.firstName || user.lastName) {
          updateData.individual = {}
          if (user.email) updateData.individual.email = user.email
          if (user.phone) updateData.individual.phone = user.phone
          if (user.firstName) updateData.individual.first_name = user.firstName
          if (user.lastName) updateData.individual.last_name = user.lastName

          // Add address if valid
          if (user.postalCode && validateSwissPostalCode(user.postalCode)) {
            updateData.individual.address = {
              country: 'CH',
              postal_code: user.postalCode.trim(),
            }
            if (user.street || user.streetNumber) {
              updateData.individual.address.line1 =
                [user.street, user.streetNumber].filter(Boolean).join(' ') || undefined
            }
            if (user.city) {
              updateData.individual.address.city = user.city
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
          await stripe.accounts.update(accountId, updateData)
          console.log(`[connect/account-session] ✅ Updated account with prefilled data`)
        }
      } catch (updateError: any) {
        // Ignore update errors - account may already have data submitted
        console.log(
          `[connect/account-session] Could not update account (may already have data): ${updateError.message}`
        )
      }
    }

    // Create AccountSession for embedded onboarding
    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            // Enable external account collection (bank accounts)
            external_account_collection: true,
          },
        },
      },
    })

    console.log(`[connect/account-session] ✅ AccountSession created for ${accountId}`)

    return NextResponse.json({
      client_secret: accountSession.client_secret,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error('[connect/account-session] Error:', error)

    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Onboarding-Session',
        error: error.message || 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
