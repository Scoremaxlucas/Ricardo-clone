import { prisma } from '@/lib/prisma'
import { sendPushForNotification } from '@/lib/push-notifications'

interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
  watchId?: string | null
  bidId?: string | null
  questionId?: string | null
  priceOfferId?: string | null
  purchaseId?: string | null
}

/**
 * Central function to create an in-app notification AND
 * send a push notification to the user's subscribed devices.
 *
 * Use this instead of directly calling prisma.notification.create()
 * to ensure push notifications are always sent alongside in-app ones.
 */
export async function createNotification(input: CreateNotificationInput) {
  // Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      watchId: input.watchId || null,
      bidId: input.bidId || null,
      questionId: input.questionId || null,
      priceOfferId: input.priceOfferId || null,
      purchaseId: input.purchaseId || null,
    },
  })

  // Send push notification (non-blocking, never throws)
  sendPushForNotification(input.userId, {
    title: input.title,
    message: input.message,
    link: input.link,
    type: input.type,
  }).catch((err) => {
    console.error('[createNotification] Push notification error:', err)
  })

  return notification
}
