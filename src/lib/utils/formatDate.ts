/** Schweizer Datumsformat dd.MM.yyyy */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}
