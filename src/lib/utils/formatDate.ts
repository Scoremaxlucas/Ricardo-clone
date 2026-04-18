/** Schweizer Datumsformat dd.MM.yyyy */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}
