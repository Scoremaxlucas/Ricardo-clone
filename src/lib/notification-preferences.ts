import { prisma } from '@/lib/prisma'

/**
 * Notification preference types that can be checked
 */
export type NotificationType =
  | 'emailOnNewMessage'
  | 'emailOnNewBid'
  | 'emailOnNewOffer'
  | 'emailOnSaleCompleted'
  | 'emailOnOutbid'
  | 'emailOnAuctionEnding'
  | 'emailOnPurchase'
  | 'emailOnShipping'
  | 'emailOnSearchMatch'
  | 'emailOnFavoritePriceChange'
  | 'emailMarketing'

/**
 * Default notification preferences (used when user has no preferences set)
 */
const DEFAULT_PREFERENCES: Record<NotificationType, boolean> = {
  emailOnNewMessage: true,
  emailOnNewBid: true,
  emailOnNewOffer: true,
  emailOnSaleCompleted: true,
  emailOnOutbid: true,
  emailOnAuctionEnding: true,
  emailOnPurchase: true,
  emailOnShipping: true,
  emailOnSearchMatch: true,
  emailOnFavoritePriceChange: false,
  emailMarketing: false,
}

/**
 * Check if a user has a specific notification type enabled
 * 
 * @param userId - The user ID to check preferences for
 * @param notificationType - The type of notification to check
 * @returns true if the notification is enabled, false otherwise
 * 
 * @example
 * const shouldSend = await shouldSendNotification(userId, 'emailOnNewBid')
 * if (shouldSend) {
 *   await sendNewBidEmail(...)
 * }
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { [notificationType]: true, emailDigestFrequency: true },
    })

    // If no preferences exist, use defaults
    if (!preferences) {
      return DEFAULT_PREFERENCES[notificationType]
    }

    // Check if digest is set to 'none' - if so, no emails at all
    if (preferences.emailDigestFrequency === 'none') {
      return false
    }

    // Return the specific preference, fallback to default
    const value = (preferences as any)[notificationType]
    return value !== undefined ? value : DEFAULT_PREFERENCES[notificationType]
  } catch (error) {
    console.error(`[notification-preferences] Error checking ${notificationType} for user ${userId}:`, error)
    // On error, default to sending (better to send than miss important notifications)
    return DEFAULT_PREFERENCES[notificationType]
  }
}

/**
 * Get all notification preferences for a user
 * 
 * @param userId - The user ID to get preferences for
 * @returns All notification preferences with defaults applied
 */
export async function getNotificationPreferences(userId: string): Promise<{
  preferences: Record<NotificationType, boolean>
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'none'
}> {
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    if (!prefs) {
      return {
        preferences: { ...DEFAULT_PREFERENCES },
        digestFrequency: 'instant',
      }
    }

    return {
      preferences: {
        emailOnNewMessage: prefs.emailOnNewMessage ?? DEFAULT_PREFERENCES.emailOnNewMessage,
        emailOnNewBid: prefs.emailOnNewBid ?? DEFAULT_PREFERENCES.emailOnNewBid,
        emailOnNewOffer: prefs.emailOnNewOffer ?? DEFAULT_PREFERENCES.emailOnNewOffer,
        emailOnSaleCompleted: prefs.emailOnSaleCompleted ?? DEFAULT_PREFERENCES.emailOnSaleCompleted,
        emailOnOutbid: prefs.emailOnOutbid ?? DEFAULT_PREFERENCES.emailOnOutbid,
        emailOnAuctionEnding: prefs.emailOnAuctionEnding ?? DEFAULT_PREFERENCES.emailOnAuctionEnding,
        emailOnPurchase: prefs.emailOnPurchase ?? DEFAULT_PREFERENCES.emailOnPurchase,
        emailOnShipping: prefs.emailOnShipping ?? DEFAULT_PREFERENCES.emailOnShipping,
        emailOnSearchMatch: prefs.emailOnSearchMatch ?? DEFAULT_PREFERENCES.emailOnSearchMatch,
        emailOnFavoritePriceChange: prefs.emailOnFavoritePriceChange ?? DEFAULT_PREFERENCES.emailOnFavoritePriceChange,
        emailMarketing: prefs.emailMarketing ?? DEFAULT_PREFERENCES.emailMarketing,
      },
      digestFrequency: (prefs.emailDigestFrequency as 'instant' | 'daily' | 'weekly' | 'none') || 'instant',
    }
  } catch (error) {
    console.error(`[notification-preferences] Error getting preferences for user ${userId}:`, error)
    return {
      preferences: { ...DEFAULT_PREFERENCES },
      digestFrequency: 'instant',
    }
  }
}

/**
 * Wrapper function to conditionally send an email based on user preferences
 * 
 * @param userId - The user ID to check preferences for
 * @param notificationType - The type of notification
 * @param sendEmailFn - The function that sends the email (called only if notification is enabled)
 * 
 * @example
 * await sendNotificationIfEnabled(
 *   sellerId,
 *   'emailOnNewBid',
 *   async () => await sendNewBidNotificationEmail(sellerId, bidAmount, watchTitle)
 * )
 */
export async function sendNotificationIfEnabled(
  userId: string,
  notificationType: NotificationType,
  sendEmailFn: () => Promise<void>
): Promise<boolean> {
  const shouldSend = await shouldSendNotification(userId, notificationType)
  
  if (shouldSend) {
    try {
      await sendEmailFn()
      console.log(`[notification-preferences] ✅ Sent ${notificationType} email to user ${userId}`)
      return true
    } catch (error) {
      console.error(`[notification-preferences] ❌ Error sending ${notificationType} email to user ${userId}:`, error)
      return false
    }
  } else {
    console.log(`[notification-preferences] ⏭️ Skipped ${notificationType} email for user ${userId} (disabled in preferences)`)
    return false
  }
}
