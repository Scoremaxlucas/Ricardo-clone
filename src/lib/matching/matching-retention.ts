import { MatchingOutboxStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type MatchingRetentionResult = {
  deletedAuditLogs: number
  deletedOutboxEvents: number
  deletedMatchingRateLimits: number
}

/**
 * Löscht alte Matching-Daten (Audit, abgeschlossene Outbox-Jobs, Rate-Limit-Zähler mit Prefix `matching:`).
 * Aufruf nur über geschützten Wartungs-Endpoint / Cron.
 */
export async function runMatchingDataRetention(opts?: {
  /** Standard 365 Tage */
  auditLogMaxAgeDays?: number
  /** Standard 90 Tage für abgeschlossene/fehlgeschlagene Outbox-Einträge */
  outboxCompletedMaxAgeDays?: number
  /** Standard 30 Tage für Matching-Rate-Limit-Zeilen */
  rateLimitMaxAgeDays?: number
}): Promise<MatchingRetentionResult> {
  const auditDays = opts?.auditLogMaxAgeDays ?? 365
  const outboxDays = opts?.outboxCompletedMaxAgeDays ?? 90
  const rlDays = opts?.rateLimitMaxAgeDays ?? 30

  const auditCutoff = new Date(Date.now() - auditDays * 86400000)
  const outboxCutoff = new Date(Date.now() - outboxDays * 86400000)
  const rlCutoff = new Date(Date.now() - rlDays * 86400000)

  const [a, o, r] = await prisma.$transaction([
    prisma.matchingAuditLog.deleteMany({
      where: { createdAt: { lt: auditCutoff } },
    }),
    prisma.matchingOutboxEvent.deleteMany({
      where: {
        status: { in: [MatchingOutboxStatus.completed, MatchingOutboxStatus.failed] },
        createdAt: { lt: outboxCutoff },
      },
    }),
    prisma.rateLimit.deleteMany({
      where: {
        identifier: { startsWith: 'matching:' },
        createdAt: { lt: rlCutoff },
      },
    }),
  ])

  return {
    deletedAuditLogs: a.count,
    deletedOutboxEvents: o.count,
    deletedMatchingRateLimits: r.count,
  }
}
