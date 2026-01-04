/**
 * useRealtimeBids Hook
 *
 * Subscribes to real-time bid updates for an auction.
 * Falls back to polling if Supabase is not configured.
 *
 * Usage:
 *   const { bids, highestBid, isConnected } = useRealtimeBids(watchId, initialBids)
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BidEvent,
  getAuctionChannel,
  getSupabaseClient,
  isRealtimeAvailable,
} from '@/lib/supabase'

export interface Bid {
  id: string
  amount: number
  createdAt: string
  userId: string
  user?: {
    id: string
    name: string | null
    email: string | null
    nickname: string | null
    image: string | null
  }
}

interface UseRealtimeBidsOptions {
  watchId: string
  initialBids?: Bid[]
  onNewBid?: (bid: Bid) => void
  onAuctionUpdate?: (update: { newEndTime?: string; isSold?: boolean }) => void
  fallbackPollingInterval?: number // ms, default 5000
}

interface UseRealtimeBidsReturn {
  bids: Bid[]
  highestBid: number | null
  isConnected: boolean
  isUsingRealtime: boolean
  refreshBids: () => Promise<void>
}

export function useRealtimeBids({
  watchId,
  initialBids = [],
  onNewBid,
  onAuctionUpdate,
  fallbackPollingInterval = 5000,
}: UseRealtimeBidsOptions): UseRealtimeBidsReturn {
  const [bids, setBids] = useState<Bid[]>(initialBids)
  const [isConnected, setIsConnected] = useState(false)
  const [isUsingRealtime, setIsUsingRealtime] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  // Calculate highest bid
  const highestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : null

  // Fetch bids from API
  const refreshBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids?watchId=${watchId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.bids)) {
          setBids(data.bids)
        }
      }
    } catch (error) {
      console.error('[useRealtimeBids] Error fetching bids:', error)
    }
  }, [watchId])

  useEffect(() => {
    if (!watchId) return

    const client = getSupabaseClient()

    // If Supabase is available, use realtime
    if (client && isRealtimeAvailable()) {
      const channelName = getAuctionChannel(watchId)
      const channel = client.channel(channelName)

      channel
        .on('broadcast', { event: 'new-bid' }, (payload) => {
          const bidData = payload.payload as BidEvent
          console.log('[useRealtimeBids] New bid received:', bidData)

          const newBid: Bid = {
            id: bidData.id,
            amount: bidData.amount,
            createdAt: bidData.createdAt,
            userId: bidData.userId,
            user: {
              id: bidData.userId,
              name: bidData.userName,
              email: null,
              nickname: null,
              image: null,
            },
          }

          setBids((prev) => {
            // Avoid duplicates
            if (prev.some((b) => b.id === newBid.id)) return prev
            return [...prev, newBid].sort((a, b) => b.amount - a.amount)
          })

          onNewBid?.(newBid)
        })
        .on('broadcast', { event: 'auction-update' }, (payload) => {
          console.log('[useRealtimeBids] Auction update:', payload.payload)
          onAuctionUpdate?.(payload.payload as { newEndTime?: string; isSold?: boolean })
        })
        .subscribe((status) => {
          console.log(`[useRealtimeBids] Channel ${channelName} status:`, status)
          setIsConnected(status === 'SUBSCRIBED')
          setIsUsingRealtime(status === 'SUBSCRIBED')
        })

      channelRef.current = channel as any

      // Initial fetch
      refreshBids()

      return () => {
        console.log(`[useRealtimeBids] Unsubscribing from ${channelName}`)
        channel.unsubscribe()
        setIsConnected(false)
      }
    }

    // Fallback: Polling
    console.log('[useRealtimeBids] Using polling fallback')
    setIsUsingRealtime(false)

    // Initial fetch
    refreshBids()

    // Set up polling interval
    const pollInterval = setInterval(() => {
      refreshBids()
    }, fallbackPollingInterval)

    setIsConnected(true) // Indicate "connected" via polling

    return () => {
      clearInterval(pollInterval)
      setIsConnected(false)
    }
  }, [watchId, refreshBids, onNewBid, onAuctionUpdate, fallbackPollingInterval])

  return {
    bids,
    highestBid,
    isConnected,
    isUsingRealtime,
    refreshBids,
  }
}

export default useRealtimeBids
