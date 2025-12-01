/**
 * RICARDO-STYLE: Helper-Funktion für Artikel-URLs
 * 
 * Verwendet bevorzugt Artikelnummer (wie Ricardo), falls vorhanden,
 * sonst fällt zurück auf CUID (interne ID)
 */

/**
 * Generiert die URL für einen Artikel
 * @param watch - Artikel mit id und optional articleNumber
 * @returns URL mit Artikelnummer (falls vorhanden) oder CUID
 */
export function getArticleUrl(watch: { id: string; articleNumber?: number | null }): string {
  // RICARDO-STYLE: Bevorzuge Artikelnummer wenn vorhanden
  if (watch.articleNumber) {
    return `/products/${watch.articleNumber}`
  }
  // Fallback auf CUID wenn keine Artikelnummer vorhanden
  return `/products/${watch.id}`
}

/**
 * Generiert die URL für einen Artikel mit nur ID
 * @param id - Artikel-ID (kann CUID oder Artikelnummer sein)
 * @returns URL
 */
export function getArticleUrlById(id: string | number): string {
  return `/products/${id}`
}

