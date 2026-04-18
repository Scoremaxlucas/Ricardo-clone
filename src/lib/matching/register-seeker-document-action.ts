'use server'

import {
  DocumentVerificationStatus,
  MatchingDocumentKind,
  MatchingDocumentStatus,
  MatchingDocumentSubject,
} from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appendMatchingAuditLog } from './matching-audit-log'
import { ensureSeekerProfileForUser } from './seeker-account'
import { z } from 'zod'

const registerSchema = z.object({
  fileKey: z.string().url().max(2000),
  kind: z.nativeEnum(MatchingDocumentKind),
  mimeType: z.string().max(120).optional().nullable(),
})

export type RegisterSeekerDocumentResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string }

export async function registerSeekerMatchingDocumentAction(raw: unknown): Promise<RegisterSeekerDocumentResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Ungültige Dokumentdaten.' }
  }

  const { fileKey, kind, mimeType } = parsed.data
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  try {
    const doc = await prisma.matchingDocument.create({
      data: {
        subjectType: MatchingDocumentSubject.seeker_profile,
        subjectId: seekerProfileId,
        uploadedByUserId: userId,
        fileKey,
        mimeType: mimeType ?? null,
        kind,
        status: MatchingDocumentStatus.pending,
      },
    })

    await prisma.documentVerification.create({
      data: {
        documentId: doc.id,
        status: DocumentVerificationStatus.pending,
      },
    })

    await appendMatchingAuditLog({
      actorUserId: userId,
      action: 'matching_document.register',
      entityType: 'matching_document',
      entityId: doc.id,
      metadata: { kind, seekerProfileId },
    })

    return { ok: true, documentId: doc.id }
  } catch (e) {
    console.error('registerSeekerMatchingDocumentAction', e)
    return { ok: false, error: 'Dokument konnte nicht registriert werden.' }
  }
}
