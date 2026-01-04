/**
 * Supabase Client for Realtime Features
 *
 * This client is used ONLY for realtime subscriptions (WebSocket).
 * All database operations continue to use Prisma.
 *
 * Setup:
 * 1. Create a free Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Add to environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Usage:
 *   import { supabase, subscribeToChannel } from '@/lib/supabase'
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

// Supabase client singleton
let supabaseInstance: SupabaseClient | null = null

/**
 * Get or create Supabase client
 * Returns null if environment variables are not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // Server-side: don't create client
    return null
  }

  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase] Not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for realtime features.'
    )
    return null
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return supabaseInstance
}

// Export singleton for convenience
export const supabase = getSupabaseClient()

/**
 * Check if Supabase Realtime is available
 */
export function isRealtimeAvailable(): boolean {
  return getSupabaseClient() !== null
}

/**
 * Subscribe to a realtime channel
 *
 * @param channelName - Unique channel name (e.g., 'auction-123')
 * @param onMessage - Callback for received messages
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToChannel(
  channelName: string,
  onMessage: (payload: { event: string; payload: unknown }) => void
): () => void {
  const client = getSupabaseClient()

  if (!client) {
    console.warn('[Supabase] Cannot subscribe - client not available')
    return () => {}
  }

  const channel = client.channel(channelName)

  channel
    .on('broadcast', { event: '*' }, (payload) => {
      onMessage({ event: payload.event, payload: payload.payload })
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase] Subscribed to ${channelName}`)
      }
    })

  return () => {
    console.log(`[Supabase] Unsubscribing from ${channelName}`)
    channel.unsubscribe()
  }
}

/**
 * Broadcast a message to a channel
 *
 * @param channelName - Channel to broadcast to
 * @param event - Event name (e.g., 'new-bid')
 * @param payload - Data to send
 */
export async function broadcastToChannel(
  channelName: string,
  event: string,
  payload: unknown
): Promise<void> {
  const client = getSupabaseClient()

  if (!client) {
    console.warn('[Supabase] Cannot broadcast - client not available')
    return
  }

  const channel = client.channel(channelName)

  await channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
  })
}

// Types for realtime events
export interface BidEvent {
  id: string
  watchId: string
  userId: string
  amount: number
  userName: string
  createdAt: string
}

export interface NotificationEvent {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string
  createdAt: string
}

export interface AuctionUpdateEvent {
  watchId: string
  newEndTime?: string
  isSold?: boolean
  highestBid?: number
}

// Channel name helpers
export const getAuctionChannel = (watchId: string) => `auction-${watchId}`
export const getUserNotificationChannel = (userId: string) => `notifications-${userId}`
export const getGlobalChannel = () => 'global-updates'

