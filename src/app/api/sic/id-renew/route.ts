import { prisma } from '@/lib/prisma'
import { deleteSicBlob } from '@/lib/sic/blob-delete'
import { readSicFacts, sicIdCapsExpiry, sicIdReplacementDue } from '@/lib/sic/facts'
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
      householdKind: true,
      modules: {
        where: { moduleKind: { in: ['AUFENTHALT', 'BONITAET'] } },
        select: { id: true, moduleKind: true, status: true, verifiedFacts: true },
      },
    },
  })
  const row = cert?.modules.find(m => m.moduleKind === 'AUFENTHALT')
  if (!cert || !row) {
    return NextResponse.json(
      { ok: false, message: 'Keine Ausweis-Angabe auf diesem Zertifikat.' },
      { status: 404 }
    )
  }
  if (cert.status === 'REVOKED' || row.status !== 'VERIFIED') {
    return NextResponse.json(
      { ok: false, message: 'Ein neuer Ausweis geht nur mit einem geprüften Ausweis.' },
      { status: 409 }
    )
  }
  const idFacts = readSicFacts('AUFENTHALT', row.verifiedFacts)
  const extract = cert.modules.find(m => m.moduleKind === 'BONITAET' && m.status === 'VERIFIED')
  const active =
    cert.status === 'ACTIVE' && !!cert.expiresAt && cert.expiresAt.getTime() > now.getTime()
  // Läuft das Zertifikat: wenn der Ausweis es kürzt oder bald abläuft. Abgelaufen: nur
  // wenn der Ausweis der Grund war und der Auszug noch trägt — sonst ist es eine Verlängerung.
  const open =
    active ?
      sicIdReplacementDue(idFacts, cert.expiresAt, now)
    : sicIdCapsExpiry(idFacts, extract ? readSicFacts('BONITAET', extract.verifiedFacts) : null, now)
  if (!open) {
    return NextResponse.json(
      {
        ok: false,
        message: active ? 'Dein Ausweis ist noch länger gültig.' : 'Dafür braucht es eine Verlängerung mit neuem Auszug.',
      },
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
    // Paar: Dateien sind keiner Person zugeordnet. Löschten wir sie, müssten beide neu
    // hochladen, obwohl nur ein Ausweis abläuft. Also bleiben sie, und es kommt nur der
    // neue Ausweis dazu (die Mindestanzahl für die Prüfung ist damit erreicht).
    if (cert.householdKind === 'COUPLE') return []
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
