import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeSicModuleIds, resolveSicCheckoutModuleIds, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { normalizeEmail } from '@/lib/sic/session'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

/** Preisvorschau für Landing — gleiches Pricing wie Checkout (returning = Basis entfällt). */
export async function POST(req: NextRequest) {
  let email = ''
  let requested: SicModuleId[] = []
  try {
    const body = await req.json()
    email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')
    requested = normalizeSicModuleIds(body?.moduleIds)
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const rl = await checkRateLimit({ identifier: `sic-quote:${clientIp(req)}`, limit: 60, window: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, message: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const sess = getSicSession()
  const knownSelf = sess?.email === email
  const existing =
    knownSelf ?
      await prisma.sicCertificate.findUnique({
        where: { email },
        select: { modules: { select: { moduleKind: true } } },
      })
    : null
  const includeBaseFee = !existing
  const alreadyPaid = (existing?.modules ?? []).map(m => m.moduleKind)
  const candidate = resolveSicCheckoutModuleIds({
    includeBaseFee,
    requested,
    alreadyPaid,
  })
  const quote = quoteSicOrder({ includeBaseFee, moduleIds: candidate })

  return NextResponse.json({
    ok: true,
    includeBaseFee,
    alreadyOwned: knownSelf ? alreadyPaid : [],
    candidate,
    quote,
    note:
      knownSelf && !includeBaseFee ?
        candidate.length === 0 ?
          'Alle gewählten Module sind bereits Teil deines Zertifikats.'
        : 'Basis entfällt — Zertifikat existiert bereits.'
      : null,
  })
}
