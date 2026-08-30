import { requireSicAdmin } from '@/lib/sic/admin'
import { resendSicWorkspaceMagicLink } from '@/lib/sic/admin-magic-link'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Support: Anmeldelink erneut an die Zertifikats-E-Mail senden. */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  let body: { certificateId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const certificateId = typeof body.certificateId === 'string' ? body.certificateId.trim() : ''
  if (!certificateId) {
    return NextResponse.json({ ok: false, message: 'Bitte ein Zertifikat angeben.' }, { status: 400 })
  }

  const limit = await checkRateLimit({
    identifier: `sic-admin-magic:${certificateId}`,
    limit: 8,
    window: 3600,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Dieser Link wurde gerade oft genug gesendet. Bitte später erneut versuchen.' },
      { status: 429 }
    )
  }

  const result = await resendSicWorkspaceMagicLink({
    certificateId,
    reviewerId: admin.userId,
  })
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
      return NextResponse.json({ ok: false, message: 'Zertifikat nicht gefunden.' }, { status: 404 })
    }
    return NextResponse.json({ ok: false, message: 'E-Mail konnte nicht gesendet werden.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, email: result.email })
}
