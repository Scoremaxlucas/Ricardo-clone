/**
 * Cron: Wohnen E-Mail-Outbox (Retries z. B. Mieter-Bestätigung nach Bewerbung).
 */

import { processWohnenEmailOutboxBatch } from '@/lib/wohnen/email-outbox'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[wohnen-email-outbox] CRON_SECRET nicht gesetzt')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processWohnenEmailOutboxBatch(25)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[wohnen-email-outbox]', e)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
