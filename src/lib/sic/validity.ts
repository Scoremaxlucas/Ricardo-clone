import { SIC_VALIDITY_MONTHS } from '@/lib/sic/modules'

/**
 * Fügt eine Anzahl Kalendermonate hinzu und behandelt Monatsüberläufe
 * (z. B. 31.01. + 1 Monat → 28./29.02.) sauber.
 */
export function addCalendarMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime())
  const targetMonth = d.getUTCMonth() + months
  const result = new Date(
    Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
  )
  // Überlauf korrigieren: wenn der Zieltag im Zielmonat nicht existiert, auf Monatsende zurücksetzen.
  if (result.getUTCDate() !== d.getUTCDate()) {
    result.setUTCDate(0)
  }
  return result
}

/** Ablaufdatum ab einem Stichtag (Freigabe) + Gültigkeitsdauer. */
export function sicValidityExpiresAt(from = new Date()): Date {
  return addCalendarMonths(from, SIC_VALIDITY_MONTHS)
}

/**
 * Gültigkeit nach einer Freigabe: drei Monate ab diesem Tag, aber nie kürzer
 * als das bestehende Datum. Die Uhr startet mit der ersten Freigabe und
 * verlängert sich mit jeder weiteren — Vervollständigen wird belohnt.
 */
export function sicExtendedExpiresAt(currentExpiresAt: Date | null, from = new Date()): Date {
  const fresh = sicValidityExpiresAt(from)
  if (!currentExpiresAt) return fresh
  return fresh.getTime() > currentExpiresAt.getTime() ? fresh : currentExpiresAt
}

export function isSicExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false
  return expiresAt.getTime() <= now.getTime()
}

/**
 * Tage nach Ablauf, bis die hochgeladenen Dateien eines abgelaufenen
 * Zertifikats gelöscht werden. Die geprüften Angaben selbst bleiben bestehen.
 */
export const SIC_DOCS_RETENTION_DAYS = 30

/**
 * Monate, nach denen unfertige Unterlagen gelöscht werden.
 * Reine Datenschutzfrist — der Anspruch auf die Prüfung bleibt bestehen,
 * gekaufte Module verfallen nie.
 */
export const SIC_UNFINISHED_DOCS_RETENTION_MONTHS = 6

/** Ab wann liegen die Unterlagen eines unfertigen Zertifikats zu lange? */
export function sicUnfinishedDocsPurgeAt(purchasedAt: Date): Date {
  return addCalendarMonths(purchasedAt, SIC_UNFINISHED_DOCS_RETENTION_MONTHS)
}
