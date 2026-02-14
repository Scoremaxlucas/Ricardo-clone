import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@helvenda.ch',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

/**
 * Send a push notification to all subscribed devices of a user
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured, skipping push notification')
    return
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) return

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      data: {
        url: payload.url || '/',
      },
      tag: payload.tag || undefined,
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload,
            { TTL: 60 * 60 } // 1 hour
          )
        } catch (error: any) {
          // Remove invalid subscriptions (410 Gone or 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[push] Removing expired subscription for user ${userId}`)
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {})
          } else {
            throw error
          }
        }
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) {
      console.warn(`[push] ${succeeded} sent, ${failed} failed for user ${userId}`)
    }
  } catch (error) {
    console.error('[push] Error sending push notification:', error)
  }
}

/**
 * Send push notification when a new in-app notification is created.
 * Call this alongside prisma.notification.create()
 */
export async function sendPushForNotification(
  userId: string,
  notification: { title: string; message: string; link?: string | null; type?: string }
): Promise<void> {
  await sendPushNotification(userId, {
    title: notification.title,
    body: notification.message,
    url: notification.link || '/notifications',
    tag: notification.type || 'notification',
  })
}
