import { SIC_SITE_ORIGIN } from '@/lib/sic/config'
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
  if (h === 'helvenda.ch' || h === 'www.helvenda.ch' || h.endsWith('.helvenda.ch')) return true
  if (h === 'swissimmocert.ch' || h === 'www.swissimmocert.ch' || h.endsWith('.swissimmocert.ch')) {
    return true
  }
  try {
    const sicHost = new URL(SIC_SITE_ORIGIN).hostname.toLowerCase()
    if (h === sicHost) return true
    if (sicHost.startsWith('www.') && h === sicHost.slice(4)) return true
    if (!sicHost.startsWith('www.') && h === `www.${sicHost}`) return true
  } catch {
    /* ignore */
  }
  return false
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

/**
 * Sanitizes URL-like strings in plain text email bodies.
 * Prevents auto-linking to untrusted domains by mail clients.
 */
export function sanitizeEmailTextLinks(text: string): string {
  const baseUrl = getEmailBaseUrl().replace(/\/$/, '')
  const safeFallback = `${baseUrl}/`
  let output = text.replace(/\bhttps?:\/\/[^\s<>"')]+/gi, (match) =>
    sanitizeEmailUrl(match, safeFallback)
  )
  output = output.replace(/\bwww\.[^\s<>"')]+/gi, (match) =>
    sanitizeEmailUrl(`https://${match}`, safeFallback)
  )
  return output
}

