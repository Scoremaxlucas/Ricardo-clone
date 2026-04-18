import { runMatchingDataRetention } from '@/lib/matching/matching-retention'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z
  .object({
    auditLogMaxAgeDays: z.coerce.number().int().min(30).max(3650).optional(),
    outboxCompletedMaxAgeDays: z.coerce.number().int().min(7).max(730).optional(),
    rateLimitMaxAgeDays: z.coerce.number().int().min(7).max(365).optional(),
  })
  .strict()

/**
 * POST /api/internal/matching-maintenance
 * Geplanter Aufruf per Cron (z. B. täglich). Header `x-matching-maintenance-secret` muss
 * `MATCHING_MAINTENANCE_SECRET` entsprechen.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.MATCHING_MAINTENANCE_SECRET
  if (!secret) {
    return NextResponse.json({ message: 'Wartung nicht konfiguriert.' }, { status: 503 })
  }

  const hdr = request.headers.get('x-matching-maintenance-secret') || ''
  if (hdr !== secret) {
    return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
  }

  let opts: z.infer<typeof bodySchema> | undefined
  if (request.headers.get('content-type')?.includes('application/json')) {
    try {
      const json: unknown = await request.json()
      const parsed = bodySchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
      }
      opts = parsed.data
    } catch {
      return NextResponse.json({ message: 'Ungültiges JSON' }, { status: 400 })
    }
  }

  try {
    const result = await runMatchingDataRetention(opts)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[matching-maintenance]', e)
    return NextResponse.json({ message: 'Wartung fehlgeschlagen' }, { status: 500 })
  }
}
