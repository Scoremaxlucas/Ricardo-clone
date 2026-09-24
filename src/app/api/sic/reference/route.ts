import { prisma } from '@/lib/prisma'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** «Keine bisherige Vermieter-Referenz» setzen oder wieder öffnen. */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let body: { none?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }
  if (typeof body.none !== 'boolean') {
    return NextResponse.json({ ok: false, message: 'Bitte angeben, ob eine Referenz fehlt.' }, { status: 400 })
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      modules: { where: { moduleKind: 'ZUVERLAESSIGKEIT' }, select: { id: true, status: true } },
      documents: { where: { moduleKind: 'ZUVERLAESSIGKEIT' }, select: { id: true } },
    },
  })
  const row = cert?.modules[0]
  if (!cert || !row) {
    return NextResponse.json({ ok: false, message: 'Keine Referenz-Angabe auf diesem Zertifikat.' }, { status: 404 })
  }

  if (body.none) {
    if (row.status === 'VERIFIED' || row.status === 'IN_REVIEW') {
      return NextResponse.json(
        { ok: false, message: 'Die Referenz ist schon eingereicht. Entferne sie zuerst, wenn du keine hast.' },
        { status: 409 }
      )
    }
    if (cert.documents.length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Bitte zuerst die hochgeladenen Dateien entfernen.' },
        { status: 409 }
      )
    }
    await prisma.sicCertificateModule.update({
      where: { id: row.id },
      data: { status: 'NOT_APPLICABLE', reviewNote: null, reviewedAt: null, verifiedFacts: null },
    })
    return NextResponse.json({ ok: true })
  }

  if (row.status !== 'NOT_APPLICABLE') {
    return NextResponse.json({ ok: true })
  }
  await prisma.sicCertificateModule.update({
    where: { id: row.id },
    data: { status: 'PENDING_DOCS', reviewNote: null },
  })
  return NextResponse.json({ ok: true })
}
