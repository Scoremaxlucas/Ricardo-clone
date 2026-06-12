/** Täglich: Mieter mit passenden Suchkriterien über neue Inserate informieren. */

import { runListingMatchAlerts } from '@/lib/wohnen/listing-match-alerts'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runListingMatchAlerts()
  return NextResponse.json({ ok: true, ...result })
}
