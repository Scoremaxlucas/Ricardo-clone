const WOHNEN_PREVIEW_COOKIE = 'helvenda-wohnen-preview'
const SIC_PREVIEW_COOKIE = 'sic-preview'

type HeaderBag = { get(name: string): string | null }

function rawHost(h: HeaderBag): string {
  return (h.get('host') || '').split(':')[0].toLowerCase()
}

function hostnameFromOrigin(origin: string, fallback: string): string {
  try {
    return new URL(origin.replace(/\/$/, '')).hostname.toLowerCase()
  } catch {
    return fallback
  }
}

/**
 * True when this request is Swiss Immo Cert (`swissimmocert.ch`)
 * or local SIC preview (`sic-preview` cookie). Never Helvenda.
 */
export function isSicSiteHostFromHeaders(h: HeaderBag): boolean {
  const host = rawHost(h)
  if (host === 'swissimmocert.ch' || host === 'www.swissimmocert.ch') return true
  const primary = hostnameFromOrigin(process.env.NEXT_PUBLIC_SIC_URL || 'https://swissimmocert.ch', 'swissimmocert.ch')
  if (host === primary) return true
  if (primary.startsWith('www.') && host === primary.slice(4)) return true
  if (!primary.startsWith('www.') && host === `www.${primary}`) return true
  const cookie = h.get('cookie') || ''
  if (
    (host === 'localhost' || host === '127.0.0.1') &&
    cookie.includes(`${SIC_PREVIEW_COOKIE}=1`)
  ) {
    return true
  }
  return false
}

/**
 * Helvenda Wohnungen (`wohnen.helvenda.ch`) — eigener Host, nicht SIC.
 */
export function isWohnenMatchingHostFromHeaders(h: HeaderBag): boolean {
  const host = rawHost(h)
  if (host === 'wohnen.helvenda.ch') return true
  const primary = hostnameFromOrigin(
    process.env.NEXT_PUBLIC_WOHNEN_URL || 'https://wohnen.helvenda.ch',
    'wohnen.helvenda.ch'
  )
  if (host === primary) return true
  const cookie = h.get('cookie') || ''
  if (
    (host === 'localhost' || host === '127.0.0.1') &&
    cookie.includes(`${WOHNEN_PREVIEW_COOKIE}=1`)
  ) {
    return true
  }
  return false
}
