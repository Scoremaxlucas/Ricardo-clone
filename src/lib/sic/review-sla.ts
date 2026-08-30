/**
 * Interne Prüfung-SLA: 1 Werktag nach Eingang, Europe/Zurich, Mo–Fr.
 * Wochenenden zählen nicht — analog zur öffentlichen Copy.
 */

const TZ = 'Europe/Zurich'

export function zurichYmd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Wochentag des Kalendertags (0 = So … 6 = Sa), unabhängig von der Zeitzone. */
function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay()
}

function isWeekdayYmd(ymd: string): boolean {
  const wd = weekdayOfYmd(ymd)
  return wd >= 1 && wd <= 5
}

/**
 * Werktage in Zürich nach dem Eingangstag bis einschliesslich heute.
 * Eingang Montag → Dienstag = 1, Mittwoch = 2. Freitag → Montag = 1.
 */
export function zurichWeekdaysAfterReceipt(receivedAt: Date, now = new Date()): number {
  const start = zurichYmd(receivedAt)
  const end = zurichYmd(now)
  if (end <= start) return 0
  let count = 0
  let ymd = addDaysToYmd(start, 1)
  while (ymd <= end) {
    if (isWeekdayYmd(ymd)) count += 1
    ymd = addDaysToYmd(ymd, 1)
  }
  return count
}

export type SicReviewSlaState = 'on_track' | 'due_today' | 'overdue'

/** 1 Werktag nach Eingang: am Folgetag fällig, danach überfällig. */
export function sicReviewSlaState(receivedAt: Date, now = new Date()): SicReviewSlaState {
  const n = zurichWeekdaysAfterReceipt(receivedAt, now)
  if (n > 1) return 'overdue'
  if (n === 1) return 'due_today'
  return 'on_track'
}

export function sicReviewSlaOverdue(receivedAt: Date, now = new Date()): boolean {
  return sicReviewSlaState(receivedAt, now) === 'overdue'
}

export function sicReviewSlaLabel(receivedAt: Date, now = new Date()): string {
  const n = zurichWeekdaysAfterReceipt(receivedAt, now)
  const state = sicReviewSlaState(receivedAt, now)
  if (state === 'overdue') {
    return n === 2 ? 'SLA überschritten · 2 Werktage' : `SLA überschritten · ${n} Werktage`
  }
  if (state === 'due_today') return 'SLA: fällig heute'
  return 'SLA: 1 Werktag'
}
