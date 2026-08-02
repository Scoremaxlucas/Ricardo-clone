import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sicPaths, sicUrl } from '@/lib/sic/config'
import { normalizeEmail } from '@/lib/sic/session'

/** Kurzlebiger, einmalig verwendbarer Anmeldelink. */
export const SIC_MAGIC_LINK_TTL_MINUTES = 30

export function generateSicMagicToken(): string {
  return randomBytes(32).toString('base64url')
}

export function buildSicMagicLinkUrl(token: string): string {
  return sicUrl(`${sicPaths.authCallback}?token=${encodeURIComponent(token)}`)
}

export async function createSicMagicLink(
  emailRaw: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const email = normalizeEmail(emailRaw)
  const token = generateSicMagicToken()
  const expiresAt = new Date(Date.now() + SIC_MAGIC_LINK_TTL_MINUTES * 60_000)
  await prisma.sicMagicLink.create({ data: { email, token, expiresAt } })
  return { token, url: buildSicMagicLinkUrl(token), expiresAt }
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
