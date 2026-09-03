import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
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
function marketplaceAuthOrigin(): string {
  for (const raw of [process.env.NEXTAUTH_URL, MAIN_SHOP_ORIGIN]) {
    const base = raw?.replace(/\/$/, '')
    if (!base) continue
    try {
      if (!isSicProductionHostname(new URL(base).hostname)) return base
    } catch {
      /* ignore */
    }
  }
  return 'https://www.helvenda.ch'
}

export function googleOAuthCallbackUrlForHost(host?: string | null): string {
  const h = (host || '').split(':')[0].toLowerCase()
  if (h && isSicProductionHostname(h)) return sicGoogleOAuthCallbackUrl()
  return `${marketplaceAuthOrigin()}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

export function sicPostLoginPath(callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl
  }
  return '/sic/admin'
}
