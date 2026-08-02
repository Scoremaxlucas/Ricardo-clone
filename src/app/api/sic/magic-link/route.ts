import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { sendSicMagicLinkEmail } from '@/lib/sic/email'
import { normalizeEmail } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

/**
 * Fordert einen Anmeldelink an. Antwortet immer generisch (kein Konto-Enumerieren):
 * gesendet wird nur, wenn zu dieser E-Mail bereits ein Zertifikat/Dossier existiert.
 */
export async function POST(req: NextRequest) {
  let email = ''
  try {
    const body = await req.json()
    email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const ip = clientIp(req)
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit({ identifier: `sic-magic:ip:${ip}`, limit: 10, window: 3600 }),
    checkRateLimit({ identifier: `sic-magic:email:${email}`, limit: 5, window: 3600 }),
  ])
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 }
    )
  }

  const generic = NextResponse.json({
    ok: true,
    message: 'Falls ein Zertifikat zu dieser E-Mail existiert, haben wir dir einen Anmeldelink gesendet.',
  })

  const certificate = await prisma.sicCertificate.findUnique({ where: { email }, select: { id: true } })
  if (!certificate) return generic

  try {
    const { url } = await createSicMagicLink(email)
    await sendSicMagicLinkEmail(email, url)
  } catch (err) {
    console.error('[sic/magic-link] send failed', err)
    // Trotzdem generisch antworten.
  }

  return generic
}
