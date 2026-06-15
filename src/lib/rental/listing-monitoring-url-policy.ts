import { getForbiddenRentalImportSource } from '@/lib/rental/ingest-source-policy'

/** Domains für automatische Frische-Prüfung (Cron) — keine Konkurrenz-Portale. */
const ALLOWED_MONITORING_HOST_SUFFIXES = [
  'tutti.ch',
  'urbanhome.ch',
  'anibis.ch',
  'facebook.com',
  'fb.com',
  'fb.me',
] as const

const MAX_URL_LEN = 2000

function matchesHostSuffix(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(`.${suffix}`)
}

export function isHttpListingUrl(raw: string | null | undefined): boolean {
  const t = raw?.trim()
  if (!t) return false
  return /^https?:\/\//i.test(t)
}

function hostIsAllowlistedForMonitoring(host: string): boolean {
  const h = host.toLowerCase()
  return ALLOWED_MONITORING_HOST_SUFFIXES.some(suffix => matchesHostSuffix(h, suffix))
}

export function isAllowlistedMonitoringUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim())
    if (!isHttpListingUrl(url.toString())) return false
    if (getForbiddenRentalImportSource(url.toString())) return false
    return hostIsAllowlistedForMonitoring(url.hostname)
  } catch {
    return false
  }
}

export function normalizeListingHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim().slice(0, MAX_URL_LEN)
  if (!t) return null
  if (!isHttpListingUrl(t)) return null
  try {
    return new URL(t).toString()
  } catch {
    return null
  }
}

/** Referenz-URL: beliebige http(s)-Domain (z. B. Homegate) — nur intern, kein Auto-Fetch. */
export function rentalReferenceUrlPolicyMessage(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw !== 'string') return 'Ungültige Referenz-URL'
  const t = raw.trim()
  if (!t) return null
  if (!isHttpListingUrl(t)) {
    return 'Referenz-URL muss mit http:// oder https:// beginnen.'
  }
  try {
    new URL(t)
    return null
  } catch {
    return 'Ungültige Referenz-URL'
  }
}

/** Monitoring-URL: nur erlaubte Domains — löst Cron-Prüfung aus. */
export function rentalMonitoringUrlPolicyMessage(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw !== 'string') return 'Ungültige Monitoring-URL'
  const t = raw.trim()
  if (!t) return null
  if (!isHttpListingUrl(t)) {
    return 'Monitoring-URL muss mit http:// oder https:// beginnen.'
  }
  const forbidden = getForbiddenRentalImportSource(t)
  if (forbidden) {
    return `${forbidden.label} darf nicht für automatische Prüfung hinterlegt werden. Nutze die Referenz-URL (nur intern) oder Tutti/UrbanHome/Anibis.`
  }
  if (!isAllowlistedMonitoringUrl(t)) {
    return 'Monitoring-URL: nur Tutti, UrbanHome, Anibis oder Facebook (https://…).'
  }
  return null
}

export function resolveListingMonitoringUrl(listing: {
  monitoringUrl?: string | null
  importedFrom?: string | null
}): string | null {
  const mon = listing.monitoringUrl?.trim()
  if (mon && isAllowlistedMonitoringUrl(mon)) return mon

  const imp = listing.importedFrom?.trim()
  if (imp && isAllowlistedMonitoringUrl(imp)) return imp

  return null
}

export function rentalListingHasAutoMonitoring(listing: {
  monitoringUrl?: string | null
  importedFrom?: string | null
}): boolean {
  return resolveListingMonitoringUrl(listing) !== null
}

export function allowedMonitoringHostLabels(): string {
  return 'Tutti, UrbanHome, Anibis, Facebook'
}
