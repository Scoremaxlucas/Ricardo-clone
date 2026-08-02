import { prisma } from '@/lib/prisma'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Setzt den Namen, der auf dem Zertifikat erscheint (nur eigenes Dossier). */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let body: { firstName?: string; lastName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const firstName = (body.firstName ?? '').trim().slice(0, 80)
  const lastName = (body.lastName ?? '').trim().slice(0, 80)
  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, message: 'Bitte Vor- und Nachname angeben.' }, { status: 400 })
  }

  const updated = await prisma.sicCertificate.updateMany({
    where: { email: session.email },
    data: { holderFirstName: firstName, holderLastName: lastName },
  })
  if (updated.count === 0) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
