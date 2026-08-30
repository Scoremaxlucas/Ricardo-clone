import { isSicProductionHostname, SIC_SITE_ORIGIN } from '@/lib/sic/config'

export const GOOGLE_OAUTH_CALLBACK_PATH = '/api/auth/callback/google'

/** In Google Cloud als Authorized redirect URI eintragen (Apex, nicht www). */
export function sicGoogleOAuthCallbackUrl(): string {
  return `${SIC_SITE_ORIGIN}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

/**
 * Callback-URL für den laufenden Host.
 * SIC immer Apex — damit Google nur eine URI braucht und das Session-Cookie
 * nicht zwischen www und Apex zerfällt.
 */
export function googleOAuthCallbackUrlForHost(host?: string | null): string {
  const h = (host || '').split(':')[0].toLowerCase()
  if (h && isSicProductionHostname(h)) return sicGoogleOAuthCallbackUrl()
  const base = (process.env.NEXTAUTH_URL || 'https://www.helvenda.ch').replace(/\/$/, '')
  return `${base}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

/** www.swissimmocert.ch → Apex, sonst landet Google-OAuth auf dem falschen Host. */
export function shouldRedirectSicWwwToApex(host: string, pathname: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  if (!h.startsWith('www.')) return false
  if (!isSicProductionHostname(h)) return false
  try {
    const apex = new URL(SIC_SITE_ORIGIN).hostname.toLowerCase()
    if (h === apex) return false
  } catch {
    if (h === 'swissimmocert.ch') return false
  }
  return (
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname.startsWith('/sic/admin')
  )
}

export function sicPostLoginPath(callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl
  }
  return '/sic/admin'
}
