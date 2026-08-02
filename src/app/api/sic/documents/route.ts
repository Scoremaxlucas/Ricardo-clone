import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { encryptPdfForStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { isSicModuleId } from '@/lib/sic/modules'
import { getSicSession } from '@/lib/sic/session-cookie'
import { put } from '@vercel/blob'
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
    return NextResponse.json({ ok: false, message: 'Zu viele Uploads. Bitte später erneut.' }, { status: 429 })
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

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: { id: true, modules: { where: { moduleKind }, select: { id: true, status: true } } },
  })
  if (!cert) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }
  const moduleRow = cert.modules[0]
  if (!moduleRow) {
    return NextResponse.json(
      { ok: false, message: 'Dieses Modul wurde nicht erworben.' },
      { status: 403 }
    )
  }

  const original = Buffer.from(await file.arrayBuffer())
  const { buffer, encrypted } = encryptPdfForStorageBestEffort(original)
  const ext = encrypted ? 'bin' : file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] || 'bin'
  const path = `sic/${cert.id}/${moduleKind}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`

  let blobUrl: string
  try {
    const blob = await put(path, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: encrypted ? 'application/octet-stream' : file.type,
    })
    blobUrl = blob.url
  } catch (err) {
    console.error('[sic/documents] blob upload failed', err)
    return NextResponse.json({ ok: false, message: 'Upload fehlgeschlagen.' }, { status: 502 })
  }

  await prisma.$transaction([
    prisma.sicDocument.create({
      data: {
        certificateId: cert.id,
        moduleKind,
        blobUrl,
        fileName: file.name.slice(0, 200),
        contentType: file.type,
        sizeBytes: original.length,
      },
    }),
    // Nachweis eingereicht -> in Prüfung (nur wenn noch nicht freigegeben/abgelehnt).
    prisma.sicCertificateModule.updateMany({
      where: { id: moduleRow.id, status: 'PENDING_DOCS' },
      data: { status: 'IN_REVIEW' },
    }),
  ])

  return NextResponse.json({ ok: true })
}
