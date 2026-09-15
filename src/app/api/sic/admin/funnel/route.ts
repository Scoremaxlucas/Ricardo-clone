import { checkRateLimit } from '@/lib/rate-limit'
import { requireSicAdmin } from '@/lib/sic/admin'
import { parseSicFunnelDays } from '@/lib/sic/funnel'
import { loadSicFunnel } from '@/lib/sic/funnel-query'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Kohorte: Checkout → Upload → Freigabe → PDF → Scan. */
export async function GET(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  // Analyse-Aggregate sind kostspielig — Dashboard soll nicht per Auto-Reload
  // die DB grillen. 60/h reicht dicke.
  const rl = await checkRateLimit({
    identifier: `sic-admin-funnel:${admin.userId}`,
    limit: 60,
    window: 3600,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Zu viele Abfragen. Kurz warten.' },
      { status: 429 }
    )
  }

  const days = parseSicFunnelDays(req.nextUrl.searchParams.get('days'))
  const funnel = await loadSicFunnel(days)
  return NextResponse.json({ ok: true, funnel })
}
