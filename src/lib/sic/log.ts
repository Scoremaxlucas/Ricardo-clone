import * as Sentry from '@sentry/nextjs'

/** Schlüssel, die nie an Sentry gehen (Personenbezug, Speicherpfade). */
const SIC_ALERT_DROP_KEYS = new Set(['email', 'blobUrl', 'holderName', 'ip'])

/** Fehlgeschlagene Zahlungen, Mails, Uploads, Cron — davon soll jemand erfahren. */
export function isSicAlertEvent(event: string): boolean {
  return /failed|error/.test(event)
}

/**
 * Strukturiertes Einzeilen-JSON-Log für SIC (Vercel Log Drain).
 *
 * `console.info`, nicht `console.log`: der Produktions-Build entfernt `console.log`
 * (siehe next.config.js), die Ereignisse kämen sonst nie in den Logs an.
 * Fehlerereignisse gehen zusätzlich als Warnung an Sentry, sofern eingerichtet.
 */
export function sicLog(event: string, payload: Record<string, unknown> = {}): void {
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...payload,
    })
  )
  if (isSicAlertEvent(event)) {
    const extra = Object.fromEntries(Object.entries(payload).filter(([k]) => !SIC_ALERT_DROP_KEYS.has(k)))
    Sentry.captureMessage(event, { level: 'error', extra })
  }
}
