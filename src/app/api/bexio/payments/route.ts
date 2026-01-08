/**
 * Bexio Payment Matching API
 *
 * POST /api/bexio/payments - Verarbeitet eingehende Zahlungen und matched zu Rechnungen
 *
 * Dieser Endpoint sollte regelmässig via Cron-Job aufgerufen werden
 * z.B. alle 15 Minuten via Vercel Cron oder externe Cron-Dienste
 */

import { processIncomingPayments } from '@/lib/bexio-sync'
import { NextRequest, NextResponse } from 'next/server'

// Cron-Job Secret für sichere Aufrufe
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung via Secret Header (für Cron-Jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')

    // Entweder Bearer Token oder Cron Secret muss stimmen
    if (CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[Bexio] Starting payment matching process...')

    const result = await processIncomingPayments()

    console.log(
      `[Bexio] Payment matching complete: ${result.matched} matched, ${result.unmatched} unmatched`
    )

    if (result.errors.length > 0) {
      console.warn('[Bexio] Errors during matching:', result.errors)
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[Bexio] Payment processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    )
  }
}

// GET für manuelle Statusabfragen
export async function GET() {
  return NextResponse.json({
    message: 'Bexio Payment Matching API',
    usage: 'POST to this endpoint to process incoming payments',
    cronSchedule: 'Recommended: every 15 minutes',
  })
}
