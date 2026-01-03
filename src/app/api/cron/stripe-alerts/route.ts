import { checkAndSendAlerts } from '@/lib/stripe-alerts'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron job endpoint for checking Stripe webhook alerts
 * Should be called periodically (e.g., every hour)
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/stripe-alerts",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndSendAlerts()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('[cron/stripe-alerts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
