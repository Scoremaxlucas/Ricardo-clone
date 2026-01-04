/**
 * useRealtimeNotifications Hook
 *
 * Subscribes to real-time notification updates for a user.
 * Falls back to polling if Supabase is not configured.
 *
 * Usage:
 *   const { unreadCount, isConnected } = useRealtimeNotifications(userId)
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSupabaseClient,
  getUserNotificationChannel,
  isRealtimeAvailable,
  NotificationEvent,
} from '@/lib/supabase'

interface UseRealtimeNotificationsOptions {
  userId: string | undefined
  onNewNotification?: (notification: NotificationEvent) => void
  fallbackPollingInterval?: number // ms, default 30000
}

interface UseRealtimeNotificationsReturn {
  unreadCount: number
  isConnected: boolean
  isUsingRealtime: boolean
  refreshCount: () => Promise<void>
}

export function useRealtimeNotifications({
  userId,
  onNewNotification,
  fallbackPollingInterval = 30000,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isUsingRealtime, setIsUsingRealtime] = useState(false)
  const channelRef = useRef<any>(null)

  // Fetch unread count from API
  const refreshCount = useCallback(async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('[useRealtimeNotifications] Error fetching count:', error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const client = getSupabaseClient()

    // If Supabase is available, use realtime
    if (client && isRealtimeAvailable()) {
      const channelName = getUserNotificationChannel(userId)
      const channel = client.channel(channelName)

      channel
        .on('broadcast', { event: 'new-notification' }, (payload) => {
          const notification = payload.payload as NotificationEvent
          console.log('[useRealtimeNotifications] New notification:', notification)

          // Increment unread count
          setUnreadCount((prev) => prev + 1)

          // Trigger callback
          onNewNotification?.(notification)
        })
        .on('broadcast', { event: 'notifications-read' }, () => {
          console.log('[useRealtimeNotifications] Notifications marked as read')
          refreshCount()
        })
        .subscribe((status) => {
          console.log(`[useRealtimeNotifications] Channel ${channelName} status:`, status)
          setIsConnected(status === 'SUBSCRIBED')
          setIsUsingRealtime(status === 'SUBSCRIBED')
        })

      channelRef.current = channel

      // Initial fetch
      refreshCount()

      return () => {
        console.log(`[useRealtimeNotifications] Unsubscribing from ${channelName}`)
        channel.unsubscribe()
        setIsConnected(false)
      }
    }

    // Fallback: Polling
    console.log('[useRealtimeNotifications] Using polling fallback')
    setIsUsingRealtime(false)

    // Initial fetch
    refreshCount()

    // Set up polling interval (only when tab is visible)
    let pollInterval: NodeJS.Timeout | null = null

    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = setInterval(refreshCount, fallbackPollingInterval)
    }

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCount()
        startPolling()
      } else {
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    if (document.visibilityState === 'visible') {
      startPolling()
    }

    setIsConnected(true)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      setIsConnected(false)
    }
  }, [userId, refreshCount, onNewNotification, fallbackPollingInterval])

  return {
    unreadCount,
    isConnected,
    isUsingRealtime,
    refreshCount,
  }
}

export default useRealtimeNotifications
