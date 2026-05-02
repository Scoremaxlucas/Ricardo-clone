import { getEmailBaseUrl } from '@/lib/email/config'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import type { SignupIntent } from '@/lib/signup-intent'

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '')
}

/**
 * Basis-URL für den Link in der Verifizierungs-E-Mail.
 * Wohnen-Registrierungen: Produktion → wohnen.helvenda.ch; lokal → gleiche Origin wie getEmailBaseUrl (localhost).
 */
export function getVerificationEmailLinkOrigin(signupIntent: SignupIntent): string {
  if (signupIntent !== 'wohnen') {
    return stripTrailingSlash(getEmailBaseUrl())
  }
  const nonProd = process.env.NODE_ENV !== 'production' && !process.env.VERCEL
  if (nonProd) {
    const base = getEmailBaseUrl()
    try {
      const host = new URL(base).hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1') {
        return stripTrailingSlash(base)
      }
    } catch {
      /* ignore */
    }
  }
  return stripTrailingSlash(WOHNEN_SITE_ORIGIN)
}

export function buildVerificationEmailLink(token: string, signupIntent: SignupIntent): string {
  const origin = getVerificationEmailLinkOrigin(signupIntent)
  const intentQs = signupIntent === 'wohnen' ? '&intent=wohnen' : ''
  return `${origin}/verify-email?token=${encodeURIComponent(token)}${intentQs}`
}
