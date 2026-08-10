import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

export const SIC_BRAND_NAME = 'Swiss Immo Cert'
export const SIC_BRAND_SHORT = 'SIC'

/**
 * Kanonische Origin der SIC-Plattform (Apex — nicht www).
 * Vercel: www → Apex redirecten (nicht Apex → www), sonst SSL-Warnung:
 * Zertifikat deckt oft nur swissimmocert.ch ab, Redirect auf www schlägt fehl.
 * Env: `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch`
 */
export const SIC_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SIC_URL || 'https://swissimmocert.ch'
).replace(/\/$/, '')

/** Alle SIC-Seiten leben unter diesem Präfix (Koexistenz mit bestehender App). */
export const SIC_BASE_PATH = '/sic'

export const SIC_PREVIEW_COOKIE = 'helvenda-sic-preview'

/** Hostnamen, auf denen SIC gerendert wird (ohne Port). */
export function sicProductionHosts(): string[] {
  try {
    const primary = new URL(SIC_SITE_ORIGIN).hostname.toLowerCase()
    const hosts = new Set<string>([primary])
    if (primary.startsWith('www.')) hosts.add(primary.slice(4))
    else hosts.add(`www.${primary}`)
    return Array.from(hosts)
  } catch {
    return ['swissimmocert.ch', 'www.swissimmocert.ch']
  }
}

export function isSicProductionHostname(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  return sicProductionHosts().includes(h)
}

/**
 * Frühere SIC-Adresse — leitet Middleware permanent auf {@link SIC_SITE_ORIGIN} um.
 * Wohnen bleibt separat über {@link WOHNEN_SITE_ORIGIN} referenzierbar.
 */
export function isLegacySicHostname(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  try {
    const legacy = new URL(WOHNEN_SITE_ORIGIN).hostname.toLowerCase()
    return h === legacy
  } catch {
    return h === 'wohnen.helvenda.ch'
  }
}

export const sicPaths = {
  /** Root wird auf dem SIC-Host auf die Landing umgeschrieben. */
  landing: '/',
  /** Post-Purchase-Workspace (früher „Dossier“). */
  certificateWorkspace: `${SIC_BASE_PATH}/zertifikat`,
  checkoutSuccess: `${SIC_BASE_PATH}/checkout/erfolg`,
  checkoutCancel: `${SIC_BASE_PATH}/checkout/abbruch`,
  verify: (code: string) => `${SIC_BASE_PATH}/verify/${encodeURIComponent(code)}`,
  faq: `${SIC_BASE_PATH}/faq`,
  authCallback: '/api/sic/auth/callback',
} as const

export function sicUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SIC_SITE_ORIGIN}${p === '/' ? '' : p}`
}

export function sicVerifyUrl(code: string): string {
  return sicUrl(sicPaths.verify(code))
}
