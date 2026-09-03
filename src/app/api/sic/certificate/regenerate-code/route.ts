import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { retireAndReplaceSicCertificateCode } from '@/lib/sic/codes'
import { sicLog } from '@/lib/sic/log'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Erzeugt einen neuen Zertifikatscode. Der Code ist der Schlüssel zur
 * Prüfseite: wer ihn hat, sieht die geprüften Angaben. Ist ein Dokument in
 * falsche Hände geraten, muss der Halter es entwerten können — der alte
 * QR-Code bleibt auffindbar und weist «ersetzt» aus, ohne Angaben zu zeigen.
 */
export async function POST() {
  const session = getSicSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })
  }

  const rl = await checkRateLimit({ identifier: `sic-recode:${session.email}`, limit: 5, window: 86400 })
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Der Code wurde heute mehrfach erneuert. Bitte morgen erneut.' },
      { status: 429 }
    )
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: { id: true },
  })
  if (!cert) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }

  try {
    const certificateCode = await retireAndReplaceSicCertificateCode(cert.id)
    sicLog('sic.certificate.code_regenerated', { certificateId: cert.id })
    return NextResponse.json({ ok: true, certificateCode })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Neuer Code konnte nicht erzeugt werden. Bitte später erneut.' },
      { status: 500 }
    )
  }
}
