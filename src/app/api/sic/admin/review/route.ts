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
import { sendSicCertificateReadyEmail, sendSicModuleRejectedEmail } from '@/lib/sic/email'
import { normalizeSicFacts, readSicFacts } from '@/lib/sic/facts'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { getSicModule, isSicModuleId } from '@/lib/sic/modules'
import { approveSicModule, rejectSicModule } from '@/lib/sic/review'
import { sicReviewSlaOverdue } from '@/lib/sic/review-sla'
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

  const [inReview, pendingDocs, certs, inReviewModules] = await Promise.all([
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
    prisma.sicCertificateModule.findMany({
      where: { status: 'IN_REVIEW' },
      select: { certificateId: true, moduleKind: true },
    }),
  ])

  const firstUploadByKey = new Map<string, Date>()
  if (inReviewModules.length > 0) {
    const reviewDocs = await prisma.sicDocument.findMany({
      where: {
        OR: inReviewModules.map(m => ({
          certificateId: m.certificateId,
          moduleKind: m.moduleKind,
        })),
      },
      select: { certificateId: true, moduleKind: true, uploadedAt: true },
      orderBy: { uploadedAt: 'asc' },
    })
    for (const d of reviewDocs) {
      const key = `${d.certificateId}:${d.moduleKind}`
      if (!firstUploadByKey.has(key)) firstUploadByKey.set(key, d.uploadedAt)
    }
  }
  const slaOverdue = inReviewModules.filter(m => {
    const at = firstUploadByKey.get(`${m.certificateId}:${m.moduleKind}`)
    return at ? sicReviewSlaOverdue(at) : false
  }).length

  const page = certs.slice(0, limit)
  const hasMore = certs.length > limit
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? encodeAdminQueueCursor(last.updatedAt, last.id) : null

  const items = page.map(c => ({
    id: c.id,
    email: c.email,
    certificateCode: c.certificateCode,
    holderName: `${c.holderFirstName ?? ''} ${c.holderLastName ?? ''}`.trim() || null,
    certifiedAt: c.certifiedAt ? c.certifiedAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    updatedAt: c.updatedAt.toISOString(),
    modules: c.modules.map(m => {
      const docs = c.documents.filter(d => d.moduleKind === m.moduleKind)
      return {
        moduleKind: m.moduleKind,
        title: isSicModuleId(m.moduleKind) ? getSicModule(m.moduleKind).title : m.moduleKind,
        status: m.status,
        reviewNote: m.reviewNote,
        reviewedAt: m.reviewedAt ? m.reviewedAt.toISOString() : null,
        reviewedByUserId: m.reviewedByUserId,
        paidAt: m.paidAt.toISOString(),
        firstUploadAt: docs[0]?.uploadedAt.toISOString() ?? null,
        verifiedFacts: isSicModuleId(m.moduleKind) ? readSicFacts(m.moduleKind, m.verifiedFacts) : null,
        documents: docs.map(d => ({
          id: d.id,
          fileName: d.fileName,
          contentType: d.contentType,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
      }
    }),
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
      slaOverdue,
    },
  })
}

/** Modul freigeben oder ablehnen. */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  let body: {
    certificateId?: string
    moduleKind?: string
    action?: string
    note?: string
    facts?: unknown
  }
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

  if (action === 'reject') {
    const rejected = await rejectSicModule({
      certificateId,
      moduleKind,
      note,
      reviewerId: admin.userId,
    })
    if (!rejected) {
      return NextResponse.json({ ok: false, message: 'Modul nicht gefunden.' }, { status: 404 })
    }
    sicLog('sic.admin.review', { certificateId, moduleKind, action })
    await notifyRejected({ email: cert.email, moduleKind, note, certificateId })
    return NextResponse.json({ ok: true })
  }

  const docCount = await prisma.sicDocument.count({ where: { certificateId, moduleKind } })
  if (docCount === 0) {
    return NextResponse.json(
      { ok: false, message: 'Freigabe nicht möglich — kein Nachweis hochgeladen.' },
      { status: 400 }
    )
  }

  // Ohne geprüfte Werte entstünde wieder ein inhaltsleeres Zertifikat.
  const parsed = normalizeSicFacts(moduleKind, body.facts)
  if (!parsed.ok) {
    const problems = [
      ...parsed.missing.map(l => `${l} fehlt`),
      ...parsed.invalid.map(l => `${l} ist ungültig`),
    ]
    return NextResponse.json(
      { ok: false, message: `Freigabe nicht möglich — ${problems.join(', ')}.` },
      { status: 400 }
    )
  }

  const approved = await approveSicModule({
    certificateId,
    moduleKind,
    facts: parsed.facts,
    reviewerId: admin.userId,
  })
  if (!approved) {
    return NextResponse.json({ ok: false, message: 'Modul nicht gefunden.' }, { status: 404 })
  }

  sicLog('sic.admin.review', { certificateId, moduleKind, action, firstVerification: approved.firstVerification })

  try {
    const { url: magicLinkUrl } = await createSicMagicLink(cert.email)
    await sendSicCertificateReadyEmail({
      email: cert.email,
      moduleKind,
      certificateCode: approved.certificateCode,
      verifiedCount: approved.verifiedCount,
      expiresAt: approved.expiresAt,
      firstVerification: approved.firstVerification,
      pdfReady: !!approved.holderName,
      magicLinkUrl,
    })
  } catch (err) {
    console.error('[sic/admin/review] notification email failed', err)
    sicLog('sic.admin.review_email_failed', { certificateId, moduleKind, action })
  }

  return NextResponse.json({ ok: true, verifiedCount: approved.verifiedCount })
}

async function notifyRejected(opts: {
  email: string
  moduleKind: Parameters<typeof sendSicModuleRejectedEmail>[0]['moduleKind']
  note: string
  certificateId: string
}) {
  try {
    const { url: magicLinkUrl } = await createSicMagicLink(opts.email)
    await sendSicModuleRejectedEmail({
      email: opts.email,
      moduleKind: opts.moduleKind,
      note: opts.note,
      magicLinkUrl,
    })
  } catch (err) {
    console.error('[sic/admin/review] rejection email failed', err)
    sicLog('sic.admin.review_email_failed', {
      certificateId: opts.certificateId,
      moduleKind: opts.moduleKind,
      action: 'reject',
    })
  }
}
