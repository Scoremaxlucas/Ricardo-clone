import { prisma } from '@/lib/prisma'
import { requireSicAdmin } from '@/lib/sic/admin'
import {
  adminQueueCursorWhere,
  clampAdminQueueLimit,
  decodeAdminQueueCursor,
  encodeAdminQueueCursor,
  moduleStatusesForQueueFilter,
  parseSicAdminQueueFilter,
} from '@/lib/sic/admin-queue'
import { sendSicModuleReviewEmail } from '@/lib/sic/email'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { isSicModuleId } from '@/lib/sic/modules'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Liste Zertifikate mit offenen Modulen — Filter, oldest-first, Cursor-Pagination. */
export async function GET(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  const filter = parseSicAdminQueueFilter(req.nextUrl.searchParams.get('status'))
  const statuses = moduleStatusesForQueueFilter(filter)
  const limit = clampAdminQueueLimit(req.nextUrl.searchParams.get('limit'))
  const decoded = decodeAdminQueueCursor(req.nextUrl.searchParams.get('cursor'))

  const [inReview, pendingDocs, certs] = await Promise.all([
    prisma.sicCertificateModule.count({ where: { status: 'IN_REVIEW' } }),
    prisma.sicCertificateModule.count({ where: { status: 'PENDING_DOCS' } }),
    prisma.sicCertificate.findMany({
      where: {
        AND: [
          { modules: { some: { status: { in: statuses } } } },
          ...(decoded ? [adminQueueCursorWhere(decoded)] : []),
        ],
      },
      // Oldest open work first (cert updated when module changes / upload).
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      include: {
        modules: { orderBy: { createdAt: 'asc' } },
        documents: {
          select: { id: true, moduleKind: true, fileName: true, contentType: true, uploadedAt: true },
          orderBy: { uploadedAt: 'asc' },
        },
      },
      take: limit + 1,
    }),
  ])

  const page = certs.slice(0, limit)
  const hasMore = certs.length > limit
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? encodeAdminQueueCursor(last.updatedAt, last.id) : null

  const items = page.map(c => ({
    id: c.id,
    email: c.email,
    certificateCode: c.certificateCode,
    expiresAt: c.expiresAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    modules: c.modules.map(m => ({
      moduleKind: m.moduleKind,
      status: m.status,
      reviewNote: m.reviewNote,
      documents: c.documents
        .filter(d => d.moduleKind === m.moduleKind)
        .map(d => ({
          id: d.id,
          fileName: d.fileName,
          contentType: d.contentType,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
    })),
  }))

  return NextResponse.json({
    ok: true,
    filter,
    items,
    nextCursor,
    counts: {
      inReview,
      pendingDocs,
      totalOpen: inReview + pendingDocs,
    },
  })
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

  if (action === 'approve') {
    const docCount = await prisma.sicDocument.count({
      where: { certificateId, moduleKind },
    })
    if (docCount === 0) {
      return NextResponse.json(
        { ok: false, message: 'Freigabe nicht möglich — kein Nachweis hochgeladen.' },
        { status: 400 }
      )
    }
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

  await prisma.sicCertificate.update({
    where: { id: certificateId },
    data: { updatedAt: new Date() },
  })

  sicLog('sic.admin.review', { certificateId, moduleKind, action })

  try {
    const { url: magicLinkUrl } = await createSicMagicLink(cert.email)
    await sendSicModuleReviewEmail({
      email: cert.email,
      moduleKind,
      action,
      note: action === 'reject' ? note : null,
      magicLinkUrl,
    })
  } catch (err) {
    console.error('[sic/admin/review] notification email failed', err)
    sicLog('sic.admin.review_email_failed', { certificateId, moduleKind, action })
  }

  return NextResponse.json({ ok: true })
}
