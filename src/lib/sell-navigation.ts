/**
 * Sell wizard entry & back navigation: preserve where the user came from via ?returnTo=
 */

export const SELL_RETURN_QUERY = 'returnTo' as const

/** Same-origin path only; blocks open redirects. */
export function parseSellReturnTo(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  return trimmed
}

export function buildSellUrl(options: {
  step?: number
  draft?: string | null
  returnTo?: string | null
}): string {
  const sp = new URLSearchParams()
  if (options.step != null && !Number.isNaN(options.step)) {
    sp.set('step', String(options.step))
  }
  if (options.draft) sp.set('draft', options.draft)
  const rt = options.returnTo ? parseSellReturnTo(options.returnTo) : null
  if (rt) sp.set(SELL_RETURN_QUERY, rt)
  const q = sp.toString()
  return q ? `/sell?${q}` : '/sell'
}

/** Link target + short German label for the back control on /sell */
export function sellBackTarget(
  returnTo: string | null,
  options?: { listingWizard?: 'rent' }
): { href: string; label: string } {
  if (returnTo) {
    return { href: returnTo, label: labelForReturnPath(returnTo) }
  }
  if (options?.listingWizard === 'rent') {
    return { href: '/wohnungen', label: 'Zurück zu Mietwohnungen' }
  }
  return { href: '/my-watches/selling', label: 'Zurück zu Mein Verkaufen' }
}

function labelForReturnPath(path: string): string {
  if (path === '/' || path === '') return 'Zurück zur Startseite'
  if (path.startsWith('/my-watches/selling')) return 'Zurück zu Mein Verkaufen'
  if (path.startsWith('/my-watches')) return 'Zurück zu Meinen Angeboten'
  if (path.startsWith('/watches')) return 'Zurück zu Uhren'
  if (path.startsWith('/auctions')) return 'Zurück zu Auktionen'
  if (path.startsWith('/search')) return 'Zurück zur Suche'
  if (path.startsWith('/favorites')) return 'Zurück zu Favoriten'
  if (path.startsWith('/users/')) return 'Zurück zum Profil'
  if (path.startsWith('/sell/bulk')) return 'Zurück zum Sammel-Upload'
  if (path.startsWith('/wohnungen')) return 'Zurück zu Mietwohnungen'
  if (path.startsWith('/sell/rent')) return 'Zurück'
  return 'Zurück'
}

/**
 * Use current pathname for "Angebot erstellen" links. Avoid returnTo=/sell loops.
 */
export function sellEntryHref(pathname: string | null | undefined): string {
  const p = pathname ?? '/'
  const from = p.startsWith('/sell') ? '/my-watches/selling' : p
  const v = parseSellReturnTo(from)
  return buildSellUrl({ returnTo: v || '/my-watches/selling' })
}

/** Static pages: pass the path you want the user to return to */
export function sellLinkWithReturn(path: string): string {
  const v = parseSellReturnTo(path)
  return buildSellUrl({ returnTo: v || undefined })
}

/** Eintrag Mietwohnung — gleiche returnTo-Logik wie /sell */
export function sellRentEntryHref(pathname: string | null | undefined): string {
  const p = pathname ?? '/'
  const from = p.startsWith('/sell') ? '/wohnungen' : p
  const v = parseSellReturnTo(from)
  const sp = new URLSearchParams()
  if (v) sp.set(SELL_RETURN_QUERY, v)
  const q = sp.toString()
  return q ? `/sell/rent?${q}` : '/sell/rent'
}
