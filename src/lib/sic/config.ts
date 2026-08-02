import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

export const SIC_BRAND_NAME = 'Swiss Immo Cert'
export const SIC_BRAND_SHORT = 'SIC'

/**
 * Origin der SIC-Plattform. Entwicklung läuft vorerst auf wohnen.helvenda.ch;
 * später `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch` setzen.
 */
export const SIC_SITE_ORIGIN = (process.env.NEXT_PUBLIC_SIC_URL || WOHNEN_SITE_ORIGIN).replace(/\/$/, '')

/** Alle SIC-Seiten leben unter diesem Präfix (Koexistenz mit bestehender App). */
export const SIC_BASE_PATH = '/sic'

export const sicPaths = {
  /** Root wird auf dem SIC-Host auf die Landing umgeschrieben. */
  landing: '/',
  dossier: `${SIC_BASE_PATH}/dossier`,
  checkoutSuccess: `${SIC_BASE_PATH}/checkout/erfolg`,
  checkoutCancel: `${SIC_BASE_PATH}/checkout/abbruch`,
  verify: (code: string) => `${SIC_BASE_PATH}/verify/${encodeURIComponent(code)}`,
  authCallback: '/api/sic/auth/callback',
} as const

export function sicUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SIC_SITE_ORIGIN}${p === '/' ? '' : p}`
}

export function sicVerifyUrl(code: string): string {
  return sicUrl(sicPaths.verify(code))
}
