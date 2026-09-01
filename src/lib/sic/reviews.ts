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
    title: 'Gelesen statt überblättert',
    body: 'Du bewirbst dich wie alle anderen. Der Unterschied: der Vermieter sieht ein geprüftes Blatt statt fünf Dateien, die er nicht öffnet.',
  },
  {
    title: 'Ohne dich erklären zu müssen',
    body: 'Betreibung, Lohn, Ausweis und Referenz stehen auf einer Seite. Du hängst nicht hinterher, weil der Vermieter erst nachfragen muss.',
  },
  {
    title: 'Nicht warten auf die letzte Unterschrift',
    body: 'Die Referenz vom bisherigen Vermieter dauert oft zwei Wochen. Du kannst das PDF trotzdem schon beilegen — mit dem, was schon geprüft ist.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
