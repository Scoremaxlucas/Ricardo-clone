/**
 * Social proof auf der Landing.
 *
 * `SIC_REVIEWS`: nur echte Zitate mit Einwilligung. Leer lassen, solange keine
 * vorliegen — dann zeigt die Landing namenslose Abläufe (`SIC_USE_CASES`), keine
 * erfundenen Lara/Marco/Sofie.
 */

export type SicReview = {
  quote: string
  name: string
  place: string
}

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
