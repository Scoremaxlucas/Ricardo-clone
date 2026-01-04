/**
 * Realtime Broadcast API
 *
 * Server-side endpoint to broadcast events via Supabase Realtime.
 * This is called after database operations to notify connected clients.
 *
 * POST /api/realtime/broadcast
 * Body: { channel: string, event: string, payload: object }
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Server-side Supabase client (uses service role for broadcasting)
function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const { channel, event, payload } = await request.json()

    if (!channel || !event) {
      return NextResponse.json(
        { error: 'channel and event are required' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabase()

    if (!supabase) {
      // Supabase not configured - silently succeed (clients will use polling)
      console.log('[Realtime] Supabase not configured, skipping broadcast')
      return NextResponse.json({ success: true, broadcast: false })
    }

    // Broadcast to channel
    const channelInstance = supabase.channel(channel)

    await new Promise<void>((resolve, reject) => {
      channelInstance.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelInstance
            .send({
              type: 'broadcast',
              event,
              payload,
            })
            .then(() => {
              console.log(`[Realtime] Broadcast ${event} to ${channel}`)
              resolve()
            })
            .catch(reject)
        } else if (status === 'CHANNEL_ERROR') {
          reject(new Error('Channel error'))
        }
      })
    })

    // Cleanup
    await channelInstance.unsubscribe()

    return NextResponse.json({ success: true, broadcast: true })
  } catch (error) {
    console.error('[Realtime] Broadcast error:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast' },
      { status: 500 }
    )
  }
}
