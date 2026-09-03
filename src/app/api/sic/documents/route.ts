import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  encryptSicDocument,
  isSicDocumentEncryptionConfigured,
  SIC_DOC_ENCRYPTION_ENV,
} from '@/lib/sic/document-crypto'
import { sendSicDocumentsReceivedEmail } from '@/lib/sic/email'
import { recordSicEventOnce } from '@/lib/sic/events'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { getSicModule, isSicModuleId, sicMinDocsForReview } from '@/lib/sic/modules'
import { nextModuleStatusAfterUpload } from '@/lib/sic/module-status'
import { putSicDocumentBytes } from '@/lib/sic/blob-put'
import { getSicSession } from '@/lib/sic/session-cookie'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

export async function POST(req: NextRequest) {
  const session = getSicSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })
  }

  const rl = await checkRateLimit({ identifier: `sic-upload:${session.email}`, limit: 50, window: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, message: 'Zu viele Dateien. Bitte später erneut.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültiger Upload.' }, { status: 400 })
  }

  const file = form.get('file')
  const moduleKind = String(form.get('moduleKind') || '')

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'Keine Datei erhalten.' }, { status: 400 })
  }
  if (!isSicModuleId(moduleKind)) {
    return NextResponse.json({ ok: false, message: 'Unbekanntes Modul.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, message: 'Nur PDF, JPG, PNG oder WEBP erlaubt.' },
      { status: 415 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Datei zu gross (max. 8 MB).' }, { status: 413 })
  }

  if (!isSicDocumentEncryptionConfigured()) {
    console.error(`[sic/documents] ${SIC_DOC_ENCRYPTION_ENV} fehlt — Upload verweigert`)
    sicLog('sic.upload.blocked_no_encryption_key', {})
    return NextResponse.json(
      { ok: false, message: 'Hochladen ist vorübergehend nicht möglich. Bitte später erneut versuchen.' },
      { status: 503 }
    )
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      householdKind: true,
      modules: { where: { moduleKind }, select: { id: true, status: true } },
    },
  })
  if (!cert) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }
  // Gekaufte Module verfallen nie: eine abgelaufene Gültigkeit blockiert den
  // Upload nicht, nur ein Widerruf tut das.
  if (cert.status === 'REVOKED') {
    return NextResponse.json({ ok: false, message: 'Dieses Zertifikat ist widerrufen.' }, { status: 403 })
  }
  const moduleRow = cert.modules[0]
  if (!moduleRow) {
    return NextResponse.json(
      { ok: false, message: 'Dieses Modul wurde nicht erworben.' },
      { status: 403 }
    )
  }
  if (moduleRow.status === 'VERIFIED') {
    return NextResponse.json(
      { ok: false, message: 'Diese Angabe ist bereits geprüft — keine weitere Datei nötig.' },
      { status: 403 }
    )
  }
  if (moduleRow.status === 'IN_REVIEW') {
    // Weitere Dateien ok — Status bleibt IN_REVIEW
  }

  const original = Buffer.from(await file.arrayBuffer())
  const buffer = encryptSicDocument(original)
  const path = `sic/${cert.id}/${moduleKind}/${Date.now()}-${randomBytes(12).toString('hex')}.bin`

  let blobUrl: string
  try {
    blobUrl = await putSicDocumentBytes(path, buffer)
  } catch (err) {
    console.error('[sic/documents] blob upload failed', err)
    sicLog('sic.upload.put_failed', {
      certificateId: cert.id,
      moduleKind,
      reason: err instanceof Error ? err.message : 'unknown',
    })
    return NextResponse.json(
      { ok: false, message: 'Hochladen fehlgeschlagen. Bitte später erneut versuchen.' },
      { status: 502 }
    )
  }

  const existingForModule = await prisma.sicDocument.count({
    where: { certificateId: cert.id, moduleKind },
  })
  const isFirstDocument =
    (await prisma.sicDocument.count({ where: { certificateId: cert.id } })) === 0
  const couple = cert.householdKind === 'COUPLE'
  const minDocs = sicMinDocsForReview(moduleKind, couple)
  const docCountAfterUpload = existingForModule + 1
  const nextStatus = nextModuleStatusAfterUpload(moduleRow.status, {
    docCountAfterUpload,
    minDocs,
  })

  await prisma.$transaction(async tx => {
    await tx.sicDocument.create({
      data: {
        certificateId: cert.id,
        moduleKind,
        blobUrl,
        fileName: file.name.slice(0, 200),
        contentType: file.type,
        sizeBytes: original.length,
      },
    })
    if (nextStatus) {
      await tx.sicCertificateModule.update({
        where: { id: moduleRow.id },
        data: { status: nextStatus, reviewNote: null },
      })
      // Touch cert so Admin-Queue (oldest-first) die Nachreichung sieht.
      await tx.sicCertificate.update({
        where: { id: cert.id },
        data: { updatedAt: new Date() },
      })
    }
  })

  if (isFirstDocument) {
    await recordSicEventOnce({
      kind: 'FIRST_UPLOAD',
      certificateId: cert.id,
      email: cert.email,
      moduleKind,
    })
    try {
      const { url } = await createSicMagicLink(cert.email)
      await sendSicDocumentsReceivedEmail({
        email: cert.email,
        moduleTitle: getSicModule(moduleKind).title,
        magicLinkUrl: url,
      })
    } catch (err) {
      console.error('[sic/documents] receipt email failed', err)
    }
  }

  return NextResponse.json({ ok: true })
}

/** Nachweis löschen — nur solange das Modul nicht VERIFIED ist. */
export async function DELETE(req: NextRequest) {
  const session = getSicSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Dokument-ID fehlt.' }, { status: 400 })
  }

  const doc = await prisma.sicDocument.findUnique({
    where: { id },
    include: {
      certificate: {
        select: {
          id: true,
          email: true,
          householdKind: true,
          modules: { select: { moduleKind: true, status: true } },
        },
      },
    },
  })
  if (!doc || doc.certificate.email !== session.email) {
    return NextResponse.json({ ok: false, message: 'Nicht gefunden.' }, { status: 404 })
  }

  const moduleRow = doc.certificate.modules.find(m => m.moduleKind === doc.moduleKind)
  if (moduleRow?.status === 'VERIFIED') {
    return NextResponse.json(
      { ok: false, message: 'Verifizierte Nachweise können nicht entfernt werden.' },
      { status: 403 }
    )
  }

  try {
    const { del } = await import('@vercel/blob')
    await del(doc.blobUrl)
  } catch {
    // Blob evtl. schon weg
  }

  await prisma.sicDocument.delete({ where: { id: doc.id } })

  // Wenn zu wenige Docs (Paar: < 2) und Modul IN_REVIEW → zurück auf PENDING_DOCS
  const remaining = await prisma.sicDocument.count({
    where: { certificateId: doc.certificateId, moduleKind: doc.moduleKind },
  })
  const couple = doc.certificate.householdKind === 'COUPLE'
  const minDocs = isSicModuleId(doc.moduleKind) ? sicMinDocsForReview(doc.moduleKind, couple) : 1
  if (remaining < minDocs && moduleRow?.status === 'IN_REVIEW') {
    await prisma.sicCertificateModule.updateMany({
      where: { certificateId: doc.certificateId, moduleKind: doc.moduleKind },
      data: { status: 'PENDING_DOCS' },
    })
  }

  return NextResponse.json({ ok: true })
}

