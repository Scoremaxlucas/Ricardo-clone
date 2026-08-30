import { requireSicAdmin } from '@/lib/sic/admin'
import { formatSicChf } from '@/lib/sic/modules'
import { refundSicPaidModule } from '@/lib/sic/module-refund'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** AGB §7: bezahlte Angabe erstatten, die wir aus Gründen bei uns nicht prüfen können. */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  let body: { certificateId?: string; moduleKind?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const certificateId = typeof body.certificateId === 'string' ? body.certificateId.trim() : ''
  const moduleKind = typeof body.moduleKind === 'string' ? body.moduleKind.trim() : ''
  if (!certificateId || !moduleKind) {
    return NextResponse.json({ ok: false, message: 'Bitte Zertifikat und Angabe angeben.' }, { status: 400 })
  }

  const result = await refundSicPaidModule({
    certificateId,
    moduleKind,
    reviewerId: admin.userId,
  })
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'STRIPE' ? 502 : 400
    return NextResponse.json({ ok: false, message: result.message }, { status })
  }

  return NextResponse.json({
    ok: true,
    already: result.already,
    amountChf: result.amountChf,
    amountLabel: result.amountChf > 0 ? formatSicChf(result.amountChf) : null,
  })
}
