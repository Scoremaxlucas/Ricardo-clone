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

/**
 * Set-Cookie-Zeile zum Löschen. Next.js `cookies.set` speichert pro Name nur
 * einen Eintrag — Host-only und Domain-Clear würden sich überschreiben.
 * Deshalb `headers.append('Set-Cookie', …)` für jede Variante.
 */
export function serializeSicSessionClearCookie(domain?: string): string {
  const parts = [
    `${SIC_SESSION_COOKIE}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  if (domain) parts.push(`Domain=${domain}`)
  return parts.join('; ')
}

/** Alle möglichen sic_session-Varianten löschen (Host-only + Domain ± leading dot). */
export function sicSessionClearCookieHeaders(): string[] {
  const headers = [serializeSicSessionClearCookie()]
  const domain = sicSessionCookieDomain()
  if (domain) {
    headers.push(serializeSicSessionClearCookie(domain))
    const apex = domain.replace(/^\./, '')
    if (apex && apex !== domain) headers.push(serializeSicSessionClearCookie(apex))
  }
  return headers
}

/** Löscht Host-only- und Domain-Cookies (Apex/www) — mehrere Set-Cookie-Header. */
export function clearSicSessionCookie(res: {
  headers: { append: (name: string, value: string) => void }
}) {
  for (const line of sicSessionClearCookieHeaders()) {
    res.headers.append('Set-Cookie', line)
  }
}
