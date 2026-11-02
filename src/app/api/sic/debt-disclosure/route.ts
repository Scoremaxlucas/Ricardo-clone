import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isSicCouple } from '@/lib/sic/household'
import { recordSicEvent } from '@/lib/sic/events'
import { SIC_DEBT_CONSENT_KEY, sicSmallDebtEligible, readSicFacts } from '@/lib/sic/facts'
import { sicMinDocsForReview } from '@/lib/sic/modules'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Zustimmung: kleine offene Betreibungen (höchstens 2, unter CHF 1'000, keine
 * Verlustscheine) dürfen offen auf dem Zertifikat stehen. Ohne sie wird nie eine
 * Betreibung gedruckt. Zurückziehen geht jederzeit — steht eine schon drauf, fällt
 * der Betreibungsauszug wieder weg (und mit ihm Siegel und Gültigkeit).
 */
export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session)
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  let body: { consent?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }
  if (typeof body.consent !== 'boolean') {
    return NextResponse.json(
      { ok: false, message: 'Bitte zustimmen oder zurückziehen.' },
      { status: 400 }
    )
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      status: true,
      householdKind: true,
      modules: {
        where: { moduleKind: 'BONITAET' },
        select: { id: true, status: true, verifiedFacts: true },
      },
      documents: { where: { moduleKind: 'BONITAET' }, select: { id: true } },
    },
  })
  const row = cert?.modules[0]
  if (!cert || !row) {
    return NextResponse.json(
      { ok: false, message: 'Kein Betreibungsauszug auf diesem Zertifikat.' },
      { status: 404 }
    )
  }
  if (cert.status === 'REVOKED') {
    return NextResponse.json(
      { ok: false, message: 'Dieses Zertifikat ist widerrufen.' },
      { status: 403 }
    )
  }
  const stored =
    row.verifiedFacts && typeof row.verifiedFacts === 'object'
      ? (row.verifiedFacts as Record<string, unknown>)
      : {}

  if (body.consent) {
    if (row.status === 'VERIFIED') return NextResponse.json({ ok: true })
    // Abgelehnt, Nachweis schon da: mit der Zustimmung erneut prüfen, ohne neuen Upload.
    const minDocs = sicMinDocsForReview('BONITAET', isSicCouple(cert.householdKind))
    const reReview = row.status === 'REJECTED' && cert.documents.length >= minDocs
    await prisma.sicCertificateModule.update({
      where: { id: row.id },
      data: {
        verifiedFacts: { ...stored, [SIC_DEBT_CONSENT_KEY]: 'yes' } as Prisma.InputJsonValue,
        ...(reReview ? { status: 'IN_REVIEW', reviewNote: null } : {}),
      },
    })
    return NextResponse.json({ ok: true, reReview })
  }

  // Zurückziehen
  const facts = readSicFacts('BONITAET', row.verifiedFacts)
  const printed =
    row.status === 'VERIFIED' &&
    !!facts &&
    (sicSmallDebtEligible(facts, '') || sicSmallDebtEligible(facts, '2'))
  if (printed) {
    // Die Betreibung steht schon drauf: ohne Zustimmung darf sie das nicht mehr — Angabe fällt weg.
    await prisma.$transaction([
      prisma.sicCertificateModule.update({
        where: { id: row.id },
        data: {
          status: 'REJECTED',
          verifiedFacts: Prisma.DbNull,
          reviewNote:
            'Du hast die Zustimmung zurückgezogen. Der Betreibungsauszug steht nicht mehr auf dem Zertifikat. Reich einen Auszug ohne offene Betreibungen ein, sobald sie erledigt sind.',
        },
      }),
      prisma.sicCertificate.update({
        where: { id: cert.id },
        data: { expiresAt: null, expiryReminder14dSentAt: null, expiryReminder3dSentAt: null },
      }),
    ])
    await recordSicEvent({
      kind: 'MODULE_REJECTED',
      certificateId: cert.id,
      email: cert.email,
      moduleKind: 'BONITAET',
    })
    return NextResponse.json({ ok: true, removed: true })
  }
  const rest = Object.fromEntries(
    Object.entries(stored).filter(([k]) => k !== SIC_DEBT_CONSENT_KEY)
  )
  await prisma.sicCertificateModule.update({
    where: { id: row.id },
    data: {
      verifiedFacts: Object.keys(rest).length > 0 ? (rest as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  })
  return NextResponse.json({ ok: true })
}
