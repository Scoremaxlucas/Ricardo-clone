/**
 * Öffentliche Origins für Shop vs. Miet-Subdomain.
 * Überschreibbar per Env (Staging / Preview).
 */
export const WOHNEN_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_WOHNEN_URL || 'https://wohnen.helvenda.ch'
).replace(/\/$/, '')

export const MAIN_SHOP_ORIGIN = (
  process.env.NEXT_PUBLIC_MAIN_SHOP_URL || 'https://www.helvenda.ch'
).replace(/\/$/, '')

/** Basis-URL für Miet-Links in E-Mails (Produktion: Subdomain). */
export function getRentalPublicBaseUrl(): string {
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL
  if (isLocalDev) {
    const candidate =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    try {
      return new URL(candidate).origin.replace(/\/$/, '')
    } catch {
      return 'http://localhost:3002'
    }
  }
  return WOHNEN_SITE_ORIGIN
}
