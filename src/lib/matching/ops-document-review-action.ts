'use server'

import {
  DocumentVerificationStatus,
  MatchingDocumentStatus,
} from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appendMatchingAuditLog } from './matching-audit-log'
import { z } from 'zod'

const reviewSchema = z.object({
  documentId: z.string().cuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(4000).optional().nullable(),
})

export type OpsDocumentReviewResult = { ok: true } | { ok: false; error: string }

async function assertAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  return u?.isAdmin === true
}

export async function opsReviewMatchingDocumentAction(raw: unknown): Promise<OpsDocumentReviewResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const isAdmin = session.user.isAdmin === true || (await assertAdmin(userId))
  if (!isAdmin) return { ok: false, error: 'Keine Berechtigung.' }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Ungültige Anfrage.' }

  const { documentId, decision, notes } = parsed.data
  const docStatus =
    decision === 'approved' ? MatchingDocumentStatus.verified : MatchingDocumentStatus.rejected
  const verStatus =
    decision === 'approved' ? DocumentVerificationStatus.approved : DocumentVerificationStatus.rejected

  try {
    const ver = await prisma.documentVerification.findUnique({
      where: { documentId },
      select: { id: true },
    })
    if (!ver) return { ok: false, error: 'Eintrag nicht gefunden.' }

    await prisma.$transaction([
      prisma.documentVerification.update({
        where: { documentId },
        data: {
          status: verStatus,
          notes: notes?.trim() || null,
          verifiedAt: new Date(),
          verifiedByUserId: userId,
        },
      }),
      prisma.matchingDocument.update({
        where: { id: documentId },
        data: { status: docStatus },
      }),
    ])
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: `document_verification.${decision}`,
      entityType: 'document_verification',
      entityId: documentId,
      metadata: { verificationId: ver.id, notes: notes?.trim() || null },
    })
    return { ok: true }
  } catch (e) {
    console.error('opsReviewMatchingDocumentAction', e)
    return { ok: false, error: 'Aktion fehlgeschlagen.' }
  }
}
