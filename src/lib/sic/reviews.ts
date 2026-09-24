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
    body: 'Der Vermieter liest eine Datei statt mehrerer Anhänge. Die Angaben sind einheitlich und per QR nachvollziehbar.',
  },
  {
    title: 'Eine Datei unter vielen Bewerbungen',
    body: 'Was geprüft ist, steht beisammen. Ob das den Unterschied macht, entscheidet der Vermieter.',
  },
  {
    title: 'Klarere Entscheidung',
    body: 'Weniger Suchen in Anhängen. Ob jemand die Wohnung bekommt, bleibt die Entscheidung des Vermieters.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
