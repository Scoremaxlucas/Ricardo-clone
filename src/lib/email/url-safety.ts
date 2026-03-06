import { getEmailBaseUrl } from './config'

const ALLOWED_EXTERNAL_EMAIL_HOSTS = new Set([
  'post.ch',
  'www.post.ch',
  'dhl.ch',
  'www.dhl.ch',
  'ups.com',
  'www.ups.com',
])

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'helvenda.ch' || h === 'www.helvenda.ch' || h.endsWith('.helvenda.ch')
}

/**
 * Sanitizes a URL intended for email links.
 * Returns a safe fallback URL if the original URL is invalid or not allowed.
 */
export function sanitizeEmailUrl(rawUrl?: string, fallbackUrl?: string): string {
  const baseUrl = getEmailBaseUrl().replace(/\/$/, '')
  const safeFallback = fallbackUrl || `${baseUrl}/`
  const candidate = (rawUrl || '').trim()

  if (!candidate) return safeFallback
  if (candidate.startsWith('/')) return `${baseUrl}${candidate}`

  if (/^mailto:/i.test(candidate)) {
    return candidate
  }

  try {
    const parsed = new URL(candidate)
    const protocol = parsed.protocol.toLowerCase()
    const hostname = parsed.hostname.toLowerCase()

    if (protocol !== 'http:' && protocol !== 'https:') return safeFallback
    if (isAllowedHost(hostname) || ALLOWED_EXTERNAL_EMAIL_HOSTS.has(hostname)) {
      return parsed.toString()
    }

    return safeFallback
  } catch {
    return safeFallback
  }
}

/**
 * Sanitizes every href in email HTML to prevent unsafe outbound links.
 */
export function sanitizeEmailHtmlLinks(html: string): string {
  const baseUrl = getEmailBaseUrl().replace(/\/$/, '')
  return html.replace(/href=(["'])(.*?)\1/gi, (_full, quote: string, href: string) => {
    const safeHref = sanitizeEmailUrl(href, `${baseUrl}/`)
    return `href=${quote}${safeHref}${quote}`
  })
}

