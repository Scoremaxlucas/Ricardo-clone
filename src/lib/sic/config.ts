export const SIC_BRAND_NAME = 'Swiss Immo Cert'
export const SIC_BRAND_SHORT = 'SIC'
/** Öffentliche Ausstellerzeile auf PDF und Prüfseite — nicht die GmbH. */
export const SIC_ISSUER_LINE = 'Swiss Immo Cert · Prüfung'

/**
 * Prüfung eingereichter Unterlagen — derselbe Satz in AGB, FAQ, Landing, Dossier, Mail.
 * Nicht «24 Stunden»: Wochenende und Feiertage sind keine Werktage.
 */
export const SIC_REVIEW_SLA = 'in der Regel innerhalb eines Werktags nach Eingang'
export const SIC_REVIEW_SLA_SENTENCE = 'In der Regel innerhalb eines Werktags nach Eingang.'

/**
 * Kanonische Origin der SIC-Plattform (Apex — nicht www).
 * Env: `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch`
 *
 * Vercel kann den Apex trotzdem auf www umleiten. Dann darf die Middleware
 * nicht www → Apex schicken — das ist die Safari-Schleife «Too many redirects».
 */
export const SIC_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SIC_URL || 'https://swissimmocert.ch'
).replace(/\/$/, '')

/** Alle SIC-Seiten leben unter diesem Präfix (Koexistenz mit bestehender App). */
export const SIC_BASE_PATH = '/sic'

export const SIC_PREVIEW_COOKIE = 'sic-preview'

export const SIC_SUPPORT_EMAIL =
  process.env.SIC_SUPPORT_EMAIL?.trim() || 'support@swissimmocert.ch'

/** Betreiberin laut Handelsregister — auf Zertifikat und Landing nicht genannt. */
export const SIC_OPERATOR = {
  legalName: 'Score-Max GmbH',
  street: 'In der Hauswiese 2',
  zip: '8125',
  city: 'Zollikerberg',
  country: 'Schweiz',
  uid: 'CHE-241.917.894',
  commercialRegisterNo: 'CH-020.4.087.913-9',
  commercialRegisterCanton: 'Zürich',
  representative: 'Lucas Rodrigues, Geschäftsführer',
  phoneDisplay: '+41 44 508 28 90',
  phoneHref: 'tel:+41445082890',
} as const

export function sicOperatorAddressBlock(): string {
  return `${SIC_OPERATOR.street}\n${SIC_OPERATOR.zip} ${SIC_OPERATOR.city}\n${SIC_OPERATOR.country}`
}

/**
 * Absender-Postfach — nicht `noreply@` (Spamfilter). Reply-To bleibt Support.
 * Override: `SIC_FROM_EMAIL` (nackte Adresse oder `Name <addr>`).
 */
export const SIC_FROM_MAILBOX = 'hello@swissimmocert.ch'

export function formatSicFromAddress(raw?: string | null): string {
  const explicit = typeof raw === 'string' ? raw.trim() : ''
  if (!explicit) return `${SIC_BRAND_NAME} <${SIC_FROM_MAILBOX}>`
  if (explicit.includes('<')) return explicit
  return `${SIC_BRAND_NAME} <${explicit}>`
}

export function sicFromAddress(): string {
  return formatSicFromAddress(process.env.SIC_FROM_EMAIL)
}

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

export function sicApexHostname(): string {
  try {
    return new URL(SIC_SITE_ORIGIN).hostname.toLowerCase()
  } catch {
    return 'swissimmocert.ch'
  }
}

/** www-Variante des Apex — Alias, kein Gegen-Redirect in der Middleware. */
export function isSicWwwHostname(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  if (!h.startsWith('www.')) return false
  const apex = sicApexHostname()
  if (h === apex) return false
  return h === `www.${apex}` || isSicProductionHostname(h)
}

/** `/api/sic` nur auf dem SIC-Host. */
export function sicApiBlockedOffHost(onSicHost: boolean, pathname: string): boolean {
  return !onSicHost && pathname.startsWith('/api/sic')
}

/** `/sic` nur auf dem SIC-Host — andere Hosts liefern die Fläche nicht. */
export function sicAppBlockedOffHost(onSicHost: boolean, pathname: string): boolean {
  return !onSicHost && (pathname === '/sic' || pathname.startsWith('/sic/'))
}

export function isSicBrowserHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname.toLowerCase()
  if (isSicProductionHostname(h)) return true
  if (h === 'localhost' || h === '127.0.0.1') {
    const c = document.cookie
    return c.includes(`${SIC_PREVIEW_COOKIE}=1`)
  }
  return false
}

export const sicPaths = {
  /** Root wird auf dem SIC-Host auf die Landing umgeschrieben. */
  landing: '/',
  /** Post-Purchase-Workspace (früher „Dossier“). */
  certificateWorkspace: `${SIC_BASE_PATH}/zertifikat`,
  /** Ein Klick aus der Ablauf-Mail: Session → Stripe, sonst Anmeldung. */
  renew: `${SIC_BASE_PATH}/verlaengern`,
  checkoutSuccess: `${SIC_BASE_PATH}/checkout/erfolg`,
  checkoutCancel: `${SIC_BASE_PATH}/checkout/abbruch`,
  verify: (code: string) => `${SIC_BASE_PATH}/verify/${encodeURIComponent(code)}`,
  faq: `${SIC_BASE_PATH}/faq`,
  impressum: `${SIC_BASE_PATH}/impressum`,
  /** Seite mit Knopf — der Token wird erst per POST verbraucht. */
  loginConfirm: `${SIC_BASE_PATH}/anmelden`,
  authCallback: '/api/sic/auth/callback',
} as const

export function sicUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SIC_SITE_ORIGIN}${p === '/' ? '' : p}`
}

export function sicVerifyUrl(code: string): string {
  return sicUrl(sicPaths.verify(code))
}
