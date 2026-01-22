import { runListingAutoRenew } from '@/lib/listing-auto-renew'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Route für automatische Verlängerung
 * Aufruf: Cron (z.B. stündlich) oder manuell.
 *
 * 1. Auktionen: abgelaufen, autoRenew=true → Verlängerung um auctionDuration
 * 2. Sofortkauf: listingExpiresAt < now → Verlängerung um listingDurationDays (immer aktiv)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const result = await runListingAutoRenew()

    console.log(
      `[auto-renew] Auktionen verlängert: ${result.renewed}, Sofortkauf: ${result.renewedSofortkauf}`
    )

    return NextResponse.json({
      message: 'Auto-Renew abgeschlossen',
      renewed: result.renewed,
      renewedSofortkauf: result.renewedSofortkauf,
      boosterInvoices: result.boosterInvoices,
      total: result.totalAuctions,
      totalSofortkauf: result.totalSofortkauf,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error: any) {
    console.error('[auto-renew] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler bei Auto-Renew', error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Auto-Renew API',
    usage: 'POST mit Authorization: Bearer {CRON_SECRET}',
  })
}
