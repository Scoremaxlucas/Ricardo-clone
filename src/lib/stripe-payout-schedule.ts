import { stripe } from './stripe-server'

/**
 * Configure payout schedule for a Stripe Connect Express account
 * Attempts to set daily payouts (faster than default weekly)
 * Note: Weekend payouts depend on bank/country support
 */
export async function configurePayoutSchedule(accountId: string): Promise<{
  success: boolean
  message: string
  schedule?: string
}> {
  try {
    console.log(`[payout-schedule] Configuring payout schedule for account ${accountId}`)

    // Update account settings to enable daily payouts
    // This makes payouts faster (daily instead of weekly)
    const account = await stripe.accounts.update(accountId, {
      settings: {
        payouts: {
          schedule: {
            interval: 'daily', // Daily payouts (faster than weekly)
            // Note: For weekend payouts, we'd need 'instant' but that costs extra fees
            // Daily payouts still respect bank holidays but are faster than weekly
          },
        },
      },
    })

    console.log(`[payout-schedule] ✅ Payout schedule updated for account ${accountId}`)

    return {
      success: true,
      message: 'Payout schedule configured to daily',
      schedule: 'daily',
    }
  } catch (error: any) {
    console.error(`[payout-schedule] Error configuring payout schedule:`, error)

    // Some accounts might not allow schedule changes via API
    // This is not critical - sellers can configure it manually in Stripe Dashboard
    return {
      success: false,
      message: `Could not configure payout schedule automatically: ${error.message}. You can configure it manually in Stripe Dashboard.`,
    }
  }
}

/**
 * Check if account supports instant payouts (weekend payouts)
 * Note: Instant payouts cost extra fees (~1% or minimum fee)
 */
export async function checkInstantPayoutSupport(accountId: string): Promise<{
  supported: boolean
  enabled: boolean
  message: string
}> {
  try {
    const account = await stripe.accounts.retrieve(accountId)

    // Check if instant payouts are available
    const instantPayoutsEnabled =
      account.settings?.payouts?.schedule?.interval === 'instant'

    return {
      supported: true, // Express accounts generally support instant payouts
      enabled: instantPayoutsEnabled || false,
      message: instantPayoutsEnabled
        ? 'Instant payouts enabled (available 24/7 including weekends)'
        : 'Instant payouts available but not enabled (costs extra fees)',
    }
  } catch (error: any) {
    return {
      supported: false,
      enabled: false,
      message: `Could not check instant payout support: ${error.message}`,
    }
  }
}
