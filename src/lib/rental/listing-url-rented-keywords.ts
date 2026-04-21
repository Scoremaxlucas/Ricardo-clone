/**
 * Erkennung "vergeben" / nicht mehr verfügbar im HTML-Flachtext (Cron URL-Monitoring).
 * case-insensitive, diakritik-insensitive (z. B. loué / loue).
 */

const PHRASES = [
  // Deutsch
  'vergeben',
  'vermietet',
  'nicht mehr verfügbar',
  'bereits vergeben',
  'leider vergeben',
  'verkauft',
  'inserat nicht mehr aktiv',
  'angebot abgelaufen',
  // Französisch
  'loué',
  'plus disponible',
  'déjà loué',
  'déjà loue',
  'vendu',
  'annonce expirée',
]

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @returns das erste gefundene Keyword (Original-Schreibweise aus der Liste) oder null
 */
export function findFirstRentedKeywordInPlainText(plain: string): string | null {
  const hay = fold(plain)
  if (!hay) return null
  for (const phrase of PHRASES) {
    const needle = fold(phrase)
    if (needle && hay.includes(needle)) {
      return phrase
    }
  }
  return null
}
