import { prisma } from '@/lib/prisma'
import { parseSicHouseholdKind } from '@/lib/sic/household'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Setzt den Namen, der auf dem Zertifikat erscheint (nur eigenes Dossier). */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let body: {
    firstName?: string
    lastName?: string
    firstName2?: string
    lastName2?: string
    householdKind?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const firstName = (body.firstName ?? '').trim().slice(0, 80)
  const lastName = (body.lastName ?? '').trim().slice(0, 80)
  const firstName2 = (body.firstName2 ?? '').trim().slice(0, 80)
  const lastName2 = (body.lastName2 ?? '').trim().slice(0, 80)
  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, message: 'Bitte Vor- und Nachname angeben.' }, { status: 400 })
  }

  const couple = parseSicHouseholdKind(body.householdKind) === 'COUPLE' || (!!firstName2 && !!lastName2)
  if (couple && (!firstName2 || !lastName2)) {
    return NextResponse.json(
      { ok: false, message: 'Bitte Vor- und Nachname der zweiten Person angeben.' },
      { status: 400 }
    )
  }

  const updated = await prisma.sicCertificate.updateMany({
    where: { email: session.email },
    data: {
      holderFirstName: firstName,
      holderLastName: lastName,
      ...(couple ?
        { holder2FirstName: firstName2, holder2LastName: lastName2, householdKind: 'COUPLE' }
      : {}),
    },
  })
  if (updated.count === 0) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
