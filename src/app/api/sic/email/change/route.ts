import { checkRateLimit } from '@/lib/rate-limit'
import {
  requestSicEmailChange,
  sicEmailChangeRequestMessage,
} from '@/lib/sic/email-change'
import { sendSicEmailChangeConfirmEmail, sendSicEmailChangeNoticeEmail } from '@/lib/sic/email'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

/** Fordert die einmalige E-Mail-Änderung an. Bestätigung geht an die neue Adresse. */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let newEmail = ''
  try {
    const body = await req.json()
    newEmail = typeof body?.email === 'string' ? body.email : ''
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const ip = clientIp(req)
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit({ identifier: `sic-email-change:ip:${ip}`, limit: 10, window: 3600 }),
    checkRateLimit({ identifier: `sic-email-change:email:${session.email}`, limit: 5, window: 3600 }),
  ])
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 }
    )
  }

  const result = await requestSicEmailChange({
    currentEmail: session.email,
    newEmailRaw: newEmail,
  })
  if (!result.ok) {
    const status = result.code === 'not_found' ? 404 : 400
    return NextResponse.json({ ok: false, message: sicEmailChangeRequestMessage(result.code) }, { status })
  }

  try {
    await sendSicEmailChangeConfirmEmail(result.pendingEmail, result.confirmUrl)
  } catch (err) {
    console.error('[sic/email/change] confirm mail failed', err)
    return NextResponse.json(
      { ok: false, message: 'Die Bestätigungsmail konnte nicht gesendet werden. Bitte später erneut versuchen.' },
      { status: 502 }
    )
  }

  try {
    await sendSicEmailChangeNoticeEmail(session.email, result.pendingEmail)
  } catch (err) {
    console.error('[sic/email/change] notice mail failed', err)
  }

  return NextResponse.json({
    ok: true,
    pendingEmail: result.pendingEmail,
    message:
      'Wir haben an die neue Adresse geschrieben. Öffne die Mail und tippe auf «Bestätigen». An die bisherige Adresse geht eine Mitteilung.',
  })
}
