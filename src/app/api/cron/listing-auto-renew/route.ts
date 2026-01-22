import { runListingAutoRenew } from '@/lib/listing-auto-renew'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron: Sofortkauf- und Auktions-Verlängerung (Listing Auto-Renew).
 * Vercel Cron ruft GET auf. Auch Authorization: Bearer CRON_SECRET akzeptiert.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !vercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runListingAutoRenew()

    return NextResponse.json({
      message: 'Auto-Renew abgeschlossen',
      ...result,
    })
  } catch (error: any) {
    console.error('[cron/listing-auto-renew] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler', error: error?.message },
      { status: 500 }
    )
  }
}
