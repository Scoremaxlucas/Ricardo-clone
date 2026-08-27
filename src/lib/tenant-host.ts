const WOHNEN_PREVIEW_COOKIE = 'helvenda-wohnen-preview'
const SIC_PREVIEW_COOKIE = 'sic-preview'
const SIC_PREVIEW_COOKIE_LEGACY = 'helvenda-sic-preview'

type HeaderBag = { get(name: string): string | null }

function rawHost(h: HeaderBag): string {
  return (h.get('host') || '').split(':')[0].toLowerCase()
}

/**
 * True when this request is the SIC production host (`swissimmocert.ch`)
 * bzw. lokales SIC-Preview (Cookie), unabhängig vom URL-Pfad.
 */
export function isSicSiteHostFromHeaders(h: HeaderBag): boolean {
  const host = rawHost(h)
  if (host === 'swissimmocert.ch' || host === 'www.swissimmocert.ch') return true
  try {
    // Dynamic import avoided — keep sync; mirror sicProductionHosts defaults + env at build time via process.env
    const origin = (process.env.NEXT_PUBLIC_SIC_URL || 'https://swissimmocert.ch').replace(/\/$/, '')
    const primary = new URL(origin).hostname.toLowerCase()
    if (host === primary) return true
    if (primary.startsWith('www.') && host === primary.slice(4)) return true
    if (!primary.startsWith('www.') && host === `www.${primary}`) return true
  } catch {
    /* ignore */
  }
  const cookie = h.get('cookie') || ''
  if (
    (host === 'localhost' || host === '127.0.0.1') &&
    (cookie.includes(`${SIC_PREVIEW_COOKIE}=1`) ||
      cookie.includes(`${SIC_PREVIEW_COOKIE_LEGACY}=1`) ||
      cookie.includes(`${WOHNEN_PREVIEW_COOKIE}=1`))
  ) {
    return true
  }
  return false
}

/**
 * @deprecated Use {@link isSicSiteHostFromHeaders}. Alias for SIC-Host detection.
 */
export function isWohnenMatchingHostFromHeaders(h: HeaderBag): boolean {
  return isSicSiteHostFromHeaders(h)
}
