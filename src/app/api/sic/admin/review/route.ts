import { prisma } from '@/lib/prisma'
import { requireSicAdmin } from '@/lib/sic/admin'
import { sendSicModuleReviewEmail } from '@/lib/sic/email'
import { isSicModuleId } from '@/lib/sic/modules'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Liste aller Zertifikate mit Modulen in Prüfung (oder mit hochgeladenen Nachweisen). */
export async function GET() {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  const certs = await prisma.sicCertificate.findMany({
    where: { modules: { some: { status: { in: ['IN_REVIEW', 'PENDING_DOCS'] } } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      modules: { orderBy: { createdAt: 'asc' } },
      documents: {
        select: { id: true, moduleKind: true, fileName: true, contentType: true, uploadedAt: true },
        orderBy: { uploadedAt: 'asc' },
      },
    },
    take: 200,
  })

  const items = certs.map(c => ({
    id: c.id,
    email: c.email,
    certificateCode: c.certificateCode,
    expiresAt: c.expiresAt.toISOString(),
    modules: c.modules.map(m => ({
      moduleKind: m.moduleKind,
      status: m.status,
      reviewNote: m.reviewNote,
      documents: c.documents
        .filter(d => d.moduleKind === m.moduleKind)
        .map(d => ({ id: d.id, fileName: d.fileName, contentType: d.contentType, uploadedAt: d.uploadedAt.toISOString() })),
    })),
  }))

  return NextResponse.json({ ok: true, items })
}

/** Modul freigeben oder ablehnen. */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  let body: { certificateId?: string; moduleKind?: string; action?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { certificateId, moduleKind } = body
  const action = body.action
  if (!certificateId || !isSicModuleId(moduleKind) || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ ok: false, message: 'Ungültige Parameter.' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : ''
  if (action === 'reject' && !note) {
    return NextResponse.json({ ok: false, message: 'Bitte einen Grund für die Ablehnung angeben.' }, { status: 400 })
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: certificateId },
    select: { id: true, email: true },
  })
  if (!cert) {
    return NextResponse.json({ ok: false, message: 'Zertifikat nicht gefunden.' }, { status: 404 })
  }

  const updated = await prisma.sicCertificateModule.updateMany({
    where: { certificateId, moduleKind },
    data: {
      status: action === 'approve' ? 'VERIFIED' : 'REJECTED',
      reviewedAt: new Date(),
      reviewedByUserId: admin.userId,
      reviewNote: action === 'reject' ? note : null,
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ ok: false, message: 'Modul nicht gefunden.' }, { status: 404 })
  }

  try {
    await sendSicModuleReviewEmail({
      email: cert.email,
      moduleKind,
      action,
      note: action === 'reject' ? note : null,
    })
  } catch (err) {
    console.error('[sic/admin/review] notification email failed', err)
  }

  return NextResponse.json({ ok: true })
}
