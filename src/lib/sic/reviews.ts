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
 * Live-Testimonials — jedes hier eingecheckte Zitat muss auf **schriftliche
 * Einwilligung** der Person gestützt sein (Foto und Wortlaut). Wortlaut vor
 * dem Live-Gang mit der Person gegenprüfen; Nachnamen bewusst abgekürzt.
 */
export const SIC_REVIEWS: readonly SicReview[] = [
  {
    quote:
      'Ich musste nichts mehr erklären — der Vermieter hatte alle Angaben in einer Datei, geprüft und per QR nachvollziehbar. Kurz danach kam der Termin für die Besichtigung.',
    name: 'Sara N.',
    role: 'Mieterin',
    place: 'Wohnung in Zürich, Kreis 6',
    photo: '/sic/testimonials/01.png',
  },
]

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
