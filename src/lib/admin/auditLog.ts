import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Best-effort Admin-Audit (kein Throw) — nur Metadaten, keine Passwörter oder Kontakt-Klartext.
 */
export async function logAdminAudit(params: {
  adminUserId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const data: Prisma.AdminAuditLogCreateInput = {
      adminUserId: params.adminUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
    }
    if (params.metadata !== undefined) {
      data.metadata = params.metadata as Prisma.InputJsonValue
    }
    await prisma.adminAuditLog.create({ data })
  } catch (e) {
    console.error('[logAdminAudit]', e)
  }
}
