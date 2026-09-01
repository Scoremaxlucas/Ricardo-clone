/**
 * Kanonische Marktplatz-URL (www).
 * Überschreibbar per Env (Staging / Preview).
 */
export const MAIN_SHOP_ORIGIN = (
  process.env.NEXT_PUBLIC_MAIN_SHOP_URL || 'https://www.helvenda.ch'
).replace(/\/$/, '')

/** Helvenda Wohnungen — eigene Subdomain, nicht Swiss Immo Cert. */
export const WOHNEN_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_WOHNEN_URL || 'https://wohnen.helvenda.ch'
).replace(/\/$/, '')
