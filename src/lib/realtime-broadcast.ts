/**
 * Realtime Broadcast Helper
 *
 * Server-side helper to broadcast events to connected clients.
 * Used in API routes after database operations.
 *
 * Usage:
 *   import { broadcastBidEvent, broadcastNotification } from '@/lib/realtime-broadcast'
 *   await broadcastBidEvent(watchId, bid)
 */

import { getAuctionChannel, getUserNotificationChannel } from './supabase'

const BROADCAST_URL = '/api/realtime/broadcast'

/**
 * Internal broadcast function
 */
async function broadcast(channel: string, event: string, payload: unknown): Promise<void> {
  try {
    // Use internal API route for server-side broadcasting
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3002'
    
    await fetch(`${baseUrl}${BROADCAST_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, event, payload }),
    })
  } catch (error) {
    // Silently fail - clients will use polling as fallback
    console.error('[Realtime] Broadcast failed:', error)
  }
}

/**
 * Broadcast a new bid event
 */
export async function broadcastBidEvent(
  watchId: string,
  bid: {
    id: string
    amount: number
    userId: string
    userName: string
    createdAt: Date | string
  }
): Promise<void> {
  const channel = getAuctionChannel(watchId)
  await broadcast(channel, 'new-bid', {
    id: bid.id,
    watchId,
    userId: bid.userId,
    amount: bid.amount,
    userName: bid.userName,
    createdAt: typeof bid.createdAt === 'string' ? bid.createdAt : bid.createdAt.toISOString(),
  })
}

/**
 * Broadcast an auction update (e.g., time extended, sold)
 */
export async function broadcastAuctionUpdate(
  watchId: string,
  update: {
    newEndTime?: string
    isSold?: boolean
    highestBid?: number
  }
): Promise<void> {
  const channel = getAuctionChannel(watchId)
  await broadcast(channel, 'auction-update', {
    watchId,
    ...update,
  })
}

/**
 * Broadcast a notification to a user
 */
export async function broadcastNotification(
  userId: string,
  notification: {
    id: string
    type: string
    title: string
    message: string
    link?: string
    createdAt: Date | string
  }
): Promise<void> {
  const channel = getUserNotificationChannel(userId)
  await broadcast(channel, 'new-notification', {
    id: notification.id,
    userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    createdAt:
      typeof notification.createdAt === 'string'
        ? notification.createdAt
        : notification.createdAt.toISOString(),
  })
}

/**
 * Broadcast that notifications were read
 */
export async function broadcastNotificationsRead(userId: string): Promise<void> {
  const channel = getUserNotificationChannel(userId)
  await broadcast(channel, 'notifications-read', { userId })
}
