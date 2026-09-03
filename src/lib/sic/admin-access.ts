/** Edge-sicher — kein Import aus `session` (jsonwebtoken). */
function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * SIC-Prüfung ist kein Helvenda-Admin.
 * Nur Adressen in SIC_ADMIN_EMAILS (Komma getrennt) dürfen /sic/admin.
 * Leer = niemand — bewusst geschlossen, nicht «alle Helvenda-Admins».
 */
export function parseSicAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(',')) {
    const email = normalizeAdminEmail(part)
    if (email && email.includes('@')) seen.add(email)
  }
  return Array.from(seen)
}

export function sicAdminAllowlist(): string[] {
  return parseSicAdminEmails(process.env.SIC_ADMIN_EMAILS)
}

export function isSicAdminEmail(email: string | null | undefined): boolean {
  const allow = sicAdminAllowlist()
  if (allow.length === 0) return false
  const normalized = normalizeAdminEmail(email ?? '')
  return Boolean(normalized && allow.includes(normalized))
}
