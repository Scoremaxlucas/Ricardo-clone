import { requireSicAdmin } from '@/lib/sic/admin'
import { parseSicRevokeReason, revokeSicCertificate } from '@/lib/sic/revoke'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** AGB §8: Zertifikat widerrufen, ohne Stripe-Rückerstattung. */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  let body: { certificateId?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const certificateId = typeof body.certificateId === 'string' ? body.certificateId.trim() : ''
  const reason = parseSicRevokeReason(body.reason)
  if (!certificateId || !reason) {
    return NextResponse.json(
      { ok: false, message: 'Bitte Zertifikat und einen Grund (mindestens 8 Zeichen) angeben.' },
      { status: 400 }
    )
  }

  const result = await revokeSicCertificate({
    certificateId,
    reviewerId: admin.userId,
    reason,
  })
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: 'Zertifikat nicht gefunden.' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    already: result.already,
    certificateCode: result.certificateCode,
  })
}
