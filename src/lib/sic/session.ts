import jwt from 'jsonwebtoken'

/**
 * Leichte, passwortlose SIC-Session: signiertes Token mit der E-Mail als Identität.
 * Reine Sign/Verify-Logik (ohne next/headers), damit sie testbar bleibt.
 */

export const SIC_SESSION_COOKIE = 'sic_session'
export const SIC_SESSION_TTL_DAYS = 30

function sessionSecret(): string {
  const s = process.env.SIC_SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('SIC_SESSION_SECRET oder NEXTAUTH_SECRET muss gesetzt sein')
  return s
}

export type SicSession = { email: string }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function signSicSessionToken(email: string): string {
  return jwt.sign({ email: normalizeEmail(email) }, sessionSecret(), {
    expiresIn: `${SIC_SESSION_TTL_DAYS}d`,
  })
}

export function verifySicSessionToken(token: string | null | undefined): SicSession | null {
  if (!token) return null
  try {
    const payload = jwt.verify(token, sessionSecret()) as { email?: unknown }
    if (typeof payload?.email !== 'string' || !payload.email) return null
    return { email: payload.email }
  } catch {
    return null
  }
}

export function sicSessionCookieOptions(maxAgeSeconds = SIC_SESSION_TTL_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
