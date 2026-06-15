/**
 * Kalender-Gültigkeit für Miet-Inserate ohne überwachbare Monitoring-URL.
 * Datumsvergleiche über ISO-Strings YYYY-MM-DD mit «heute» in Europe/Zurich.
 */

import { rentalListingHasAutoMonitoring } from '@/lib/rental/listing-monitoring-url-policy'

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/

type MonitoringListingFields = {
  monitoringUrl?: string | null
  importedFrom?: string | null
}

/** @deprecated Prefer `rentalListingHasAutoMonitoring` — kept for call sites passing listing fields. */
export function rentalListingHasMonitoringHttpUrl(
  importedFromOrListing?: string | null | MonitoringListingFields
): boolean {
  if (importedFromOrListing && typeof importedFromOrListing === 'object') {
    return rentalListingHasAutoMonitoring(importedFromOrListing)
  }
  return rentalListingHasAutoMonitoring({ importedFrom: importedFromOrListing ?? null })
}

export function todayYmdInZurich(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function isValidYmd(s: string): boolean {
  const m = YMD_RE.exec(s.trim())
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

function addDaysUtcYmd(ymd: string, days: number): string {
  const m = YMD_RE.exec(ymd.trim())
  if (!m) return ymd
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function parseListingExpiresOnFromBody(body: Record<string, unknown>): string | null {
  const v = body.listingExpiresOn
  if (v === null || v === undefined || v === '') return null
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t || null
}

export function validateListingExpiresOnForUpsert(opts: {
  hasMonitoringUrl: boolean
  listingExpiresOn: string | null
  intent: 'create' | 'edit'
  /** Bei Edit: unverändert übernommenes (ggf. vergangenes) Datum erlauben — Reaktivierung prüft die Route separat. */
  existingListingExpiresOn?: string | null
}): { ok: true; value: string | null } | { ok: false; message: string } {
  const { hasMonitoringUrl, listingExpiresOn, intent, existingListingExpiresOn } = opts
  if (!listingExpiresOn) {
    if (!hasMonitoringUrl) {
      return {
        ok: false,
        message:
          'Ohne überwachbare Monitoring-URL (Tutti, UrbanHome, Anibis, …) ist ein Gültigkeitsdatum («Gültig bis») erforderlich.',
      }
    }
    return { ok: true, value: null }
  }
  if (!isValidYmd(listingExpiresOn)) {
    return { ok: false, message: 'Ungültiges Gültigkeitsdatum (YYYY-MM-DD).' }
  }
  const today = todayYmdInZurich()
  if (listingExpiresOn < today) {
    const unchanged =
      intent === 'edit' &&
      existingListingExpiresOn != null &&
      listingExpiresOn === existingListingExpiresOn
    if (!unchanged) {
      return { ok: false, message: '«Gültig bis» darf nicht in der Vergangenheit liegen.' }
    }
  }
  const max = addDaysUtcYmd(today, 730)
  if (listingExpiresOn > max) {
    return { ok: false, message: '«Gültig bis» höchstens 730 Tage in der Zukunft.' }
  }
  return { ok: true, value: listingExpiresOn }
}

/** Inserat am Kalendertag `listingExpiresOn` (CH) noch gültig; ab nächstem CH-Tag abgelaufen. */
export function isListingExpiredByChCalendar(listingExpiresOn: string, now = new Date()): boolean {
  if (!listingExpiresOn || !isValidYmd(listingExpiresOn)) return false
  const today = todayYmdInZurich(now)
  return listingExpiresOn < today
}
