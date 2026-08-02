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

/** Neues Ablaufdatum: Ausstellung/Nachkauf + Gültigkeitsdauer. */
export function sicValidityExpiresAt(from = new Date()): Date {
  return addCalendarMonths(from, SIC_VALIDITY_MONTHS)
}

/**
 * Gültigkeit bei Nachkauf: Das gesamte Zertifikat wird ab der jüngsten bezahlten
 * Aktion neu für die volle Dauer gültig — nie kürzer als das bestehende Datum.
 */
export function sicExtendedExpiresAt(currentExpiresAt: Date | null, from = new Date()): Date {
  const fresh = sicValidityExpiresAt(from)
  if (!currentExpiresAt) return fresh
  return fresh.getTime() > currentExpiresAt.getTime() ? fresh : currentExpiresAt
}

export function isSicExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return true
  return expiresAt.getTime() <= now.getTime()
}
