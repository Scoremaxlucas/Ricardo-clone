import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Bekannte `entityType`-Werte für Suche und Filter (Konvention). */
export const MATCHING_AUDIT_ENTITY_TYPES = [
  'matching_application',
  'matching_document',
  'document_verification',
  'matching_property',
  'consent_share',
] as const

export type MatchingAuditSearchParams = {
  entityType?: string | null
  entityId?: string | null
  actorUserId?: string | null
  action?: string | null
  from?: Date | null
  to?: Date | null
  limit?: number
}

export async function appendMatchingAuditLog(input: {
  actorUserId: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  try {
    await prisma.matchingAuditLog.create({
      data: {
        actorUserId: input.actorUserId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata:
          input.metadata == null ? undefined : (input.metadata as Prisma.InputJsonValue),
      },
    })
  } catch (e) {
    console.error('[appendMatchingAuditLog]', e)
  }
}

export async function searchMatchingAuditLogs(params: MatchingAuditSearchParams) {
  const limit = Math.min(Math.max(params.limit ?? 80, 1), 200)
  const where: Prisma.MatchingAuditLogWhereInput = {}

  if (params.entityType?.trim()) where.entityType = params.entityType.trim()
  if (params.entityId?.trim()) where.entityId = params.entityId.trim()
  if (params.actorUserId?.trim()) where.actorUserId = params.actorUserId.trim()
  if (params.action?.trim()) where.action = { contains: params.action.trim(), mode: 'insensitive' }

  if (params.from || params.to) {
    where.createdAt = {}
    if (params.from) where.createdAt.gte = params.from
    if (params.to) where.createdAt.lte = params.to
  }

  const rows = await prisma.matchingAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actorUser: { select: { id: true, email: true } },
    },
  })

  return rows.map(r => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: r.metadata,
    actorUserId: r.actorUserId,
    actorEmail: r.actorUser?.email ?? null,
  }))
}
