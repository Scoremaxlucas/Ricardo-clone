/**
 * Social proof auf der Landing.
 *
 * `SIC_REVIEWS`: nur echte Zitate mit schriftlicher Einwilligung. Leer lassen,
 * solange keine vorliegen — dann zeigt die Landing namenslose Abläufe
 * (`SIC_USE_CASES`), keine erfundenen Lara/Marco/Sofie.
 *
 * Bild-Assets: `public/sic/testimonials/<slug>.jpg` (Portrait, quadratisch,
 * mind. 320×320px). Dateipfad in `photo` eintragen — dann zeigt die Landing
 * das Bild in der Zitat-Kachel.
 */

export type SicReview = {
  quote: string
  name: string
  /** Ort oder Wohnungslage, z.B. «Wohnung im Kreis 4, Zürich». */
  place: string
  /** Optionale Rolle/Kontext — z.B. «Mieterin» oder «Umzug mit Familie». */
  role?: string
  /** Absoluter Pfad unter `/public`, z.B. `/sic/testimonials/lara.jpg`. */
  photo?: string
}

/**
 * @todo Sobald echte Zitate + Fotos vorliegen: Einträge hier ergänzen.
 * Format-Beispiel (nicht aktiv, dient nur der Referenz — nicht auskommentieren
 * und einchecken, sondern echte Daten einfügen):
 *
 *   {
 *     quote: '…',
 *     name: 'Vorname N.',
 *     role: 'Mieterin',
 *     place: 'Wohnung im Kreis 4, Zürich',
 *     photo: '/sic/testimonials/vorname.jpg',
 *   }
 */
export const SIC_REVIEWS: readonly SicReview[] = []

export type SicUseCase = {
  title: string
  body: string
}

export const SIC_USE_CASES: readonly SicUseCase[] = [
  {
    title: 'Weniger Prüfaufwand',
    body: 'Der Vermieter braucht weniger Zeit für die Einordnung: die Angaben sind einheitlich und per QR nachvollziehbar.',
  },
  {
    title: 'Sticht unter vielen Bewerbungen hervor',
    body: 'Mit dem Zertifikat wirkt der Bewerber sofort klar qualifiziert. Der Vermieter erkennt den Qualitätsstatus auf einen Blick.',
  },
  {
    title: 'Schnellere Entscheidung',
    body: 'Die Auswahl geht schneller weiter: weniger Rückfragen, schneller zur Vergabe.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
