import jwt from 'jsonwebtoken'
import { SIC_SITE_ORIGIN } from '@/lib/sic/config'

/**
 * Leichte, passwortlose SIC-Session: signiertes Token mit der E-Mail als Identität.
 * Reine Sign/Verify-Logik (ohne next/headers), damit sie testbar bleibt.
 */

export const SIC_SESSION_COOKIE = 'sic_session'
export const SIC_SESSION_TTL_DAYS = 30

/**
 * Sitzung direkt nach der Zahlung. Sieben Tage: Freitagabend bezahlt, am Wochenende
 * hochgeladen — ohne neuen Anmeldelink. Die Checkout-Session-ID in der History
 * stellt die Sitzung trotzdem nur kurz aus (`SIC_CHECKOUT_COOKIE_GRANT_SECONDS`).
 * Dauerhafter Zugang bleibt der Magic-Link.
 */
export const SIC_POST_CHECKOUT_TTL_DAYS = 7
export const SIC_POST_CHECKOUT_TTL_SECONDS = SIC_POST_CHECKOUT_TTL_DAYS * 24 * 60 * 60

/**
 * Das Stripe-`session_id` in der Erfolgs-URL darf nur kurz eine Sitzung ausstellen.
 * Danach gilt der Magic-Link. Sonst wäre die History ein Dauerticket ins Dossier.
 */
export const SIC_CHECKOUT_COOKIE_GRANT_SECONDS = 15 * 60

export function sicPaidCheckoutAllowsSessionCookie(
  paidAt: Date | null | undefined,
  now = new Date()
): boolean {
  if (!paidAt) return false
  return now.getTime() - paidAt.getTime() <= SIC_CHECKOUT_COOKIE_GRANT_SECONDS * 1000
}

function sessionSecret(): string {
  const s = process.env.SIC_SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('SIC_SESSION_SECRET oder NEXTAUTH_SECRET muss gesetzt sein')
  return s
}

export type SicSession = { email: string }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function signSicSessionToken(
  email: string,
  ttlSeconds = SIC_SESSION_TTL_DAYS * 24 * 60 * 60
): string {
  return jwt.sign({ email: normalizeEmail(email) }, sessionSecret(), { expiresIn: ttlSeconds })
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

/**
 * Gemeinsame Domain für Apex + www, sonst bleibt Abmelden auf www wirkungslos,
 * wenn das Cookie auf dem Apex gesetzt wurde (oder umgekehrt).
 */
export function sicSessionCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  try {
    const host = new URL(SIC_SITE_ORIGIN).hostname.toLowerCase()
    if (!host || host === 'localhost' || host.endsWith('.localhost')) return undefined
    const apex = host.startsWith('www.') ? host.slice(4) : host
    return `.${apex}`
  } catch {
    return undefined
  }
}

export function sicSessionCookieOptions(maxAgeSeconds = SIC_SESSION_TTL_DAYS * 24 * 60 * 60) {
  const domain = sicSessionCookieDomain()
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
    ...(domain ? { domain } : {}),
  }
}

/** Löscht Host-only-Cookies und Domain-Cookies (Apex/www). */
export function clearSicSessionCookie(res: {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void }
}) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  }
  // Alte Host-only-Cookies (ohne Domain)
  res.cookies.set(SIC_SESSION_COOKIE, '', base)
  const domain = sicSessionCookieDomain()
  if (domain) {
    res.cookies.set(SIC_SESSION_COOKIE, '', { ...base, domain })
  }
}
