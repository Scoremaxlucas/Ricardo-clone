const WOHNEN_PREVIEW_COOKIE = 'helvenda-wohnen-preview'

type HeaderBag = { get(name: string): string | null }

/**
 * True when this request is served on the **Matching**-Subdomain (`wohnen.helvenda.ch`)
 * bzw. lokales Wohnen-Preview (Cookie), unabhängig vom URL-Pfad.
 */
export function isWohnenMatchingHostFromHeaders(h: HeaderBag): boolean {
  const host = (h.get('host') || '').split(':')[0].toLowerCase()
  if (host === 'wohnen.helvenda.ch') return true
  const cookie = h.get('cookie') || ''
  if ((host === 'localhost' || host === '127.0.0.1') && cookie.includes(`${WOHNEN_PREVIEW_COOKIE}=1`)) {
    return true
  }
  return false
}
