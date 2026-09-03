import type { SicModuleId } from '@/lib/sic/modules'
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

/** Ablaufdatum ab einem Stichtag + Gültigkeitsdauer (Kalendermonate). */
export function sicValidityExpiresAt(from = new Date()): Date {
  return addCalendarMonths(from, SIC_VALIDITY_MONTHS)
}

/** Kalendertag aus einem Fact-Feld `YYYY-MM-DD` — UTC, ohne lokale Verschiebung. */
export function parseSicCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const y = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const d = new Date(Date.UTC(y, month - 1, day))
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return d
}

/**
 * «Gültig bis» nach einer Freigabe.
 *
 * Hängt am Betreibungsauszug: Auszugsdatum + drei Monate. Andere Angaben
 * verlängern das Siegel nicht. Fehlt die Betreibung noch, läuft eine
 * vorläufige Frist ab dem Freigabetag — bis der Auszug geprüft ist.
 * Ein später geprüfter Auszug setzt die Uhr neu, auch wenn sie kürzer wird.
 */
export function sicExpiresAtAfterApproval(opts: {
  moduleKind: SicModuleId
  extractDate?: string | null
  currentExpiresAt: Date | null
  approvedAt?: Date
}): Date {
  const approvedAt = opts.approvedAt ?? new Date()
  if (opts.moduleKind === 'BONITAET') {
    const extract = parseSicCalendarDate(opts.extractDate)
    return sicValidityExpiresAt(extract ?? approvedAt)
  }
  if (opts.currentExpiresAt) return opts.currentExpiresAt
  return sicValidityExpiresAt(approvedAt)
}

export function sicExpiryClockChanged(previous: Date | null, next: Date): boolean {
  if (!previous) return true
  return previous.getTime() !== next.getTime()
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
