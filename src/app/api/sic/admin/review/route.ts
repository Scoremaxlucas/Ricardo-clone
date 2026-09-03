import { prisma } from '@/lib/prisma'
import { requireSicAdmin } from '@/lib/sic/admin'
import {
  adminQueueCursorWhere,
  clampAdminQueueLimit,
  decodeAdminQueueCursor,
  encodeAdminQueueCursor,
  moduleStatusesForQueueFilter,
  parseSicAdminQueueFilter,
  parseSicAdminSearchQuery,
} from '@/lib/sic/admin-queue'
import { normalizeSicCertificateCode } from '@/lib/sic/certificate-code'
import { sendSicCertificateReadyEmail, sendSicModuleRejectedEmail } from '@/lib/sic/email'
import { joinHouseholdHolderName } from '@/lib/sic/dossier'
import { normalizeSicFacts, readSicFacts } from '@/lib/sic/facts'
import { isSicCouple } from '@/lib/sic/household'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { getSicModule, isSicCertificateSealReady, isSicModuleId } from '@/lib/sic/modules'
import { approveSicModule, rejectSicModule } from '@/lib/sic/review'
import { sicReviewSlaOverdue } from '@/lib/sic/review-sla'
import { normalizeEmail } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const CERT_INCLUDE = {
  modules: { orderBy: { createdAt: 'asc' as const } },
  documents: {
    select: { id: true, moduleKind: true, fileName: true, contentType: true, uploadedAt: true },
    orderBy: { uploadedAt: 'asc' as const },
  },
} satisfies Prisma.SicCertificateInclude

type CertWithReview = Prisma.SicCertificateGetPayload<{ include: typeof CERT_INCLUDE }>

function mapCertToReviewItem(c: CertWithReview) {
  return {
    id: c.id,
    email: c.email,
    certificateCode: c.certificateCode,
    holderName: joinHouseholdHolderName({
      firstName: c.holderFirstName,
      lastName: c.holderLastName,
      firstName2: c.holder2FirstName,
      lastName2: c.holder2LastName,
      couple: isSicCouple(c.householdKind),
    }),
    householdKind: c.householdKind,
    status: c.status,
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
  }
}

async function searchCertificates(q: string): Promise<CertWithReview[]> {
  const email = normalizeEmail(q)
  const code = normalizeSicCertificateCode(q)

  const [direct, payments] = await Promise.all([
    prisma.sicCertificate.findMany({
      where: {
        OR: [{ email: { contains: email } }, { certificateCode: { contains: code } }],
      },
      include: CERT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }),
    prisma.sicPayment.findMany({
      where: {
        OR: [
          { id: q },
          { stripeCheckoutSessionId: q },
          { stripePaymentIntentId: q },
          ...(q.includes('@') ? [{ email }] : []),
        ],
      },
      select: { certificateId: true, email: true },
      take: 10,
    }),
  ])

  const have = new Set(direct.map(c => c.id))
  const missingIds = payments
    .map(p => p.certificateId)
    .filter((id): id is string => !!id && !have.has(id))
  const missingEmails = payments
    .map(p => p.email)
    .filter(e => !direct.some(c => c.email === e))

  if (missingIds.length === 0 && missingEmails.length === 0) return direct

  const extra = await prisma.sicCertificate.findMany({
    where: {
      OR: [
        ...(missingIds.length > 0 ? [{ id: { in: missingIds } }] : []),
        ...(missingEmails.length > 0 ? [{ email: { in: missingEmails } }] : []),
      ],
    },
    include: CERT_INCLUDE,
  })

  const byId = new Map(direct.map(c => [c.id, c]))
  for (const c of extra) byId.set(c.id, c)
  return Array.from(byId.values())
}

/** Liste Zertifikate mit offenen Modulen — Filter, oldest-first, Cursor-Pagination. */
export async function GET(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  const filter = parseSicAdminQueueFilter(req.nextUrl.searchParams.get('status'))
  const statuses = moduleStatusesForQueueFilter(filter)
  const limit = clampAdminQueueLimit(req.nextUrl.searchParams.get('limit'))
  const decoded = decodeAdminQueueCursor(req.nextUrl.searchParams.get('cursor'))
  const search = parseSicAdminSearchQuery(req.nextUrl.searchParams.get('q'))

  const [inReview, pendingDocs, inReviewModules] = await Promise.all([
    prisma.sicCertificateModule.count({ where: { status: 'IN_REVIEW' } }),
    prisma.sicCertificateModule.count({ where: { status: 'PENDING_DOCS' } }),
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

  const counts = {
    inReview,
    pendingDocs,
    totalOpen: inReview + pendingDocs,
    slaOverdue,
  }

  if (search) {
    const found = await searchCertificates(search)
    return NextResponse.json({
      ok: true,
      filter,
      search,
      items: found.map(mapCertToReviewItem),
      nextCursor: null,
      counts,
    })
  }

  const certs = await prisma.sicCertificate.findMany({
    where: {
      AND: [
        { modules: { some: { status: { in: statuses } } } },
        ...(decoded ? [adminQueueCursorWhere(decoded)] : []),
      ],
    },
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    include: CERT_INCLUDE,
    take: limit + 1,
  })

  const page = certs.slice(0, limit)
  const hasMore = certs.length > limit
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? encodeAdminQueueCursor(last.updatedAt, last.id) : null

  return NextResponse.json({
    ok: true,
    filter,
    search: null,
    items: page.map(mapCertToReviewItem),
    nextCursor,
    counts,
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
    select: { id: true, email: true, householdKind: true },
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
  const parsed = normalizeSicFacts(moduleKind, body.facts, { couple: isSicCouple(cert.householdKind) })
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
      sealReady: isSicCertificateSealReady(approved.verifiedModuleIds),
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
