import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isSicIncomeGroup } from '@/lib/sic/facts'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * «Nicht angestellt» (selbständig, in Ausbildung, pensioniert) vermerken oder wieder öffnen.
 * Für diese Gruppen prüfen wir das Einkommen noch nicht. Die Gruppe wird gespeichert,
 * damit sichtbar bleibt, für wen sich ein eigener Einkommensnachweis lohnt.
 */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session)
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let body: { group?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const group = body.group === null ? null : isSicIncomeGroup(body.group) ? body.group : undefined
  if (group === undefined) {
    return NextResponse.json({ ok: false, message: 'Bitte eine Gruppe wählen.' }, { status: 400 })
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      status: true,
      modules: { where: { moduleKind: 'ARBEIT_EINKOMMEN' }, select: { id: true, status: true } },
      documents: { where: { moduleKind: 'ARBEIT_EINKOMMEN' }, select: { id: true } },
    },
  })
  const row = cert?.modules[0]
  if (!cert || !row) {
    return NextResponse.json(
      { ok: false, message: 'Keine Einkommens-Angabe auf diesem Zertifikat.' },
      { status: 404 }
    )
  }
  if (cert.status === 'REVOKED') {
    return NextResponse.json(
      { ok: false, message: 'Dieses Zertifikat ist widerrufen.' },
      { status: 403 }
    )
  }

  if (group) {
    if (row.status === 'VERIFIED' || row.status === 'IN_REVIEW') {
      return NextResponse.json(
        { ok: false, message: 'Lohn & Arbeitsstelle ist schon eingereicht.' },
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
      data: {
        status: 'NOT_APPLICABLE',
        reviewNote: null,
        reviewedAt: null,
        verifiedFacts: { incomeGroup: group },
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (row.status !== 'NOT_APPLICABLE') return NextResponse.json({ ok: true })
  await prisma.sicCertificateModule.update({
    where: { id: row.id },
    data: { status: 'PENDING_DOCS', reviewNote: null, verifiedFacts: Prisma.DbNull },
  })
  return NextResponse.json({ ok: true })
}
