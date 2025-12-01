import { NextRequest, NextResponse } from 'next/server'
import { processInvoiceReminders } from '@/lib/invoice-reminders'

/**
 * Vercel Cron Job Endpoint
 * Wird automatisch von Vercel täglich um 2:00 Uhr aufgerufen
 *
 * Vercel Cron Jobs senden einen Authorization Header mit dem CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Jobs senden einen Authorization Header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'development-secret'

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[cron] Unauthorized request - missing or invalid authorization header')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    console.log(`[cron] ✅ Cron-Job autorisiert, starte Mahnprozess-Verarbeitung...`)
    console.log(`[cron] ⏰ Zeitpunkt: ${new Date().toISOString()}`)

    const result = await processInvoiceReminders()

    console.log(`[cron] ✅ Verarbeitet: ${result.processed} von ${result.total} Rechnungen`)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      total: result.total,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[cron] ❌ Fehler bei Mahnprozess-Verarbeitung:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler: ' + error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST für manuelle Ausführung oder externe Cron-Services
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'development-secret'

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    console.log(`[cron] ✅ Cron-Job autorisiert, starte Mahnprozess-Verarbeitung...`)

    const result = await processInvoiceReminders()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      total: result.total,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[cron] ❌ Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler: ' + error.message,
      },
      { status: 500 }
    )
  }
}
