import type { SicModuleStatus } from '@prisma/client'

export type SicAdminQueueFilter = 'IN_REVIEW' | 'PENDING_DOCS' | 'all'

export function parseSicAdminQueueFilter(raw: string | null): SicAdminQueueFilter {
  if (raw === 'PENDING_DOCS' || raw === 'all') return raw
  return 'IN_REVIEW'
}

export function moduleStatusesForQueueFilter(filter: SicAdminQueueFilter): SicModuleStatus[] {
  if (filter === 'all') return ['IN_REVIEW', 'PENDING_DOCS']
  if (filter === 'PENDING_DOCS') return ['PENDING_DOCS']
  return ['IN_REVIEW']
}

export function clampAdminQueueLimit(raw: string | null, fallback = 50, max = 100): number {
  const n = Number.parseInt(raw || '', 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(max, n)
}

/** Freitextsuche: E-Mail, SIC-Code oder Zahlungs-ID. Unter 3 Zeichen = Queue. */
export function parseSicAdminSearchQuery(raw: string | null): string | null {
  const q = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (q.length < 3) return null
  return q.slice(0, 120)
}

const STRIPE_PAYMENT_ID_RE = /^(cs|pi)_[A-Za-z0-9_]+$/i
const CUID_RE = /^c[a-z0-9]{20,}$/i

export function sicAdminSearchLooksLikePaymentId(q: string): boolean {
  const t = q.trim()
  return STRIPE_PAYMENT_ID_RE.test(t) || CUID_RE.test(t)
}

/** Cursor = `${updatedAtISO}|${id}` für Sortierung updatedAt asc, id asc. */
export function encodeAdminQueueCursor(updatedAt: Date, id: string): string {
  return `${updatedAt.toISOString()}|${id}`
}

export function decodeAdminQueueCursor(
  raw: string | null | undefined
): { updatedAt: Date; id: string } | null {
  if (!raw) return null
  const sep = raw.indexOf('|')
  if (sep < 1) return null
  const updatedAt = new Date(raw.slice(0, sep))
  const id = raw.slice(sep + 1)
  if (!id || Number.isNaN(updatedAt.getTime())) return null
  return { updatedAt, id }
}

/** Prisma-where für Keyset-Pagination nach updatedAt/id. */
export function adminQueueCursorWhere(cursor: { updatedAt: Date; id: string }) {
  return {
    OR: [
      { updatedAt: { gt: cursor.updatedAt } },
      { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
    ],
  }
}
