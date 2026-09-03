import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sicPaths, sicUrl } from '@/lib/sic/config'
import { normalizeEmail } from '@/lib/sic/session'

/** Kurzlebiger, einmalig verwendbarer Anmeldelink. */
export const SIC_MAGIC_LINK_TTL_MINUTES = 30

const SAFE_NEXT = new Set<string>([sicPaths.certificateWorkspace, sicPaths.renew])

/** Nur interne SIC-Pfade — kein Open Redirect über den Magic-Link. */
export function safeSicNextPath(raw: unknown): string {
  if (typeof raw !== 'string') return sicPaths.certificateWorkspace
  const path = raw.trim()
  return SAFE_NEXT.has(path) ? path : sicPaths.certificateWorkspace
}

export function generateSicMagicToken(): string {
  return randomBytes(32).toString('base64url')
}

export function buildSicMagicLinkUrl(token: string, next?: string): string {
  const url = new URL(sicUrl(sicPaths.loginConfirm))
  url.searchParams.set('token', token)
  const dest = safeSicNextPath(next)
  if (dest !== sicPaths.certificateWorkspace) {
    url.searchParams.set('next', dest)
  }
  return url.toString()
}

export function sicMagicLinkStatus(
  row: { consumedAt: Date | null; expiresAt: Date } | null,
  now = new Date()
): 'valid' | 'invalid' {
  if (!row || row.consumedAt || row.expiresAt.getTime() <= now.getTime()) return 'invalid'
  return 'valid'
}

/** Liest den Token, ohne ihn zu verbrauchen — GET/Prefetch darf das. */
export async function peekSicMagicLink(tokenRaw: string): Promise<'valid' | 'invalid'> {
  const token = (tokenRaw ?? '').trim()
  if (!token) return 'invalid'
  const row = await prisma.sicMagicLink.findUnique({
    where: { token },
    select: { consumedAt: true, expiresAt: true },
  })
  return sicMagicLinkStatus(row)
}

export async function createSicMagicLink(
  emailRaw: string,
  opts?: { next?: string }
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const email = normalizeEmail(emailRaw)
  const token = generateSicMagicToken()
  const expiresAt = new Date(Date.now() + SIC_MAGIC_LINK_TTL_MINUTES * 60_000)
  await prisma.sicMagicLink.create({ data: { email, token, expiresAt } })
  return { token, url: buildSicMagicLinkUrl(token, opts?.next), expiresAt }
}

/** Verbraucht einen Token (einmalig). Gibt die E-Mail zurück oder null bei ungültig/abgelaufen/verbraucht. */
export async function consumeSicMagicLink(tokenRaw: string): Promise<{ email: string } | null> {
  const token = (tokenRaw ?? '').trim()
  if (!token) return null

  const row = await prisma.sicMagicLink.findUnique({ where: { token } })
  if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) return null

  // Atomar als verbraucht markieren (nur wenn noch nicht verbraucht) — verhindert Doppel-Einlösung.
  const updated = await prisma.sicMagicLink.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  if (updated.count !== 1) return null

  return { email: row.email }
}
