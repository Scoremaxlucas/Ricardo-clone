/**
 * Kanonische Marktplatz-URL (www) — u.a. für Middleware-Redirects von wohnen.helvenda.ch.
 * Überschreibbar per Env (Staging / Preview).
 */
export const MAIN_SHOP_ORIGIN = (
  process.env.NEXT_PUBLIC_MAIN_SHOP_URL || 'https://www.helvenda.ch'
).replace(/\/$/, '')

/** Öffentliche Mietwohnungen-Subdomain (Links vom Marktplatz-Header etc.). */
export const WOHNEN_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_WOHNEN_URL || 'https://wohnen.helvenda.ch'
).replace(/\/$/, '')
