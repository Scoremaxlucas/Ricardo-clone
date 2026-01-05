import { NextRequest, NextResponse } from 'next/server'
import { processIncomingPayments } from '@/lib/bexio-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      const vercelCron = request.headers.get('x-vercel-cron')
      if (!vercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[Cron] Starting Bexio payment sync...')
    const startTime = Date.now()

    const result = await processIncomingPayments()

    const duration = Date.now() - startTime
    console.log(`[Cron] Bexio sync completed in ${duration}ms:`, result)

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...result
    })

  } catch (error: any) {
    console.error('[Cron] Bexio sync failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Sync failed' 
      },
      { status: 500 }
    )
  }
}
