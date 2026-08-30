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
    title: 'Ein PDF statt fünf Anhänge',
    body: 'Du legst das Zertifikat bei. Der Vermieter scannt den QR und sieht, welche Angaben geprüft sind.',
  },
  {
    title: 'Was draufsteht, ist geprüft',
    body: 'Betreibungsauszug und Lohnabrechnung musst du nicht mehr einzeln erklären. Auf dem Zertifikat steht, was geprüft wurde.',
  },
  {
    title: 'Teil-Zertifikat, sobald etwas steht',
    body: 'Die Referenz vom bisherigen Vermieter dauert oft zwei Wochen. Mit den schon geprüften Angaben kannst du das PDF trotzdem beilegen.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
