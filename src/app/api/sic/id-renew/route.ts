import { prisma } from '@/lib/prisma'
import { deleteSicBlob } from '@/lib/sic/blob-delete'
import { readSicFacts, sicIdReplacementDue } from '@/lib/sic/facts'
import { getSicSession } from '@/lib/sic/session-cookie'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Neuen Ausweis einreichen, wenn der geprüfte bald abläuft oder das Zertifikat kürzt.
 * Die geprüften Werte bleiben auf dem Dokument, bis der neue Ausweis freigegeben ist;
 * die alten Ausweis-Dateien werden gelöscht. Kostenlos — kein Verlängerungsfall.
 */
export async function POST() {
  const session = getSicSession()
  if (!session)
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })

  const now = new Date()
  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      modules: {
        where: { moduleKind: 'AUFENTHALT' },
        select: { id: true, status: true, verifiedFacts: true },
      },
    },
  })
  const row = cert?.modules[0]
  if (!cert || !row) {
    return NextResponse.json(
      { ok: false, message: 'Keine Ausweis-Angabe auf diesem Zertifikat.' },
      { status: 404 }
    )
  }
  const active =
    cert.status === 'ACTIVE' && !!cert.expiresAt && cert.expiresAt.getTime() > now.getTime()
  if (!active || row.status !== 'VERIFIED') {
    return NextResponse.json(
      {
        ok: false,
        message: 'Ein neuer Ausweis geht nur bei einem gültigen Zertifikat mit geprüftem Ausweis.',
      },
      { status: 409 }
    )
  }
  if (!sicIdReplacementDue(readSicFacts('AUFENTHALT', row.verifiedFacts), cert.expiresAt, now)) {
    return NextResponse.json(
      { ok: false, message: 'Dein Ausweis ist noch länger gültig.' },
      { status: 409 }
    )
  }

  const docs = await prisma.$transaction(async tx => {
    const claimed = await tx.sicCertificateModule.updateMany({
      where: { id: row.id, status: 'VERIFIED' },
      // verifiedFacts bleiben: das laufende Zertifikat zeigt den Ausweis weiter (sicPresentedModules).
      data: {
        status: 'PENDING_DOCS',
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        uploadReminderSentAt: null,
      },
    })
    if (claimed.count === 0) return null
    const stale = await tx.sicDocument.findMany({
      where: { certificateId: cert.id, moduleKind: 'AUFENTHALT' },
      select: { id: true, blobUrl: true },
    })
    await tx.sicDocument.deleteMany({ where: { id: { in: stale.map(d => d.id) } } })
    return stale
  })
  if (!docs) return NextResponse.json({ ok: true })
  for (const doc of docs) await deleteSicBlob(doc.blobUrl)
  return NextResponse.json({ ok: true })
}
