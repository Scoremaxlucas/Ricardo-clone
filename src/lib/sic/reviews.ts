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
    title: 'Geprüft statt Selbstauskunft',
    body: 'Der Vermieter sieht bestätigte Angaben, nicht ungeprüfte Unterlagen. Das ist eine Grundlage für die Auswahl — nicht nur ein weiterer Anhang.',
  },
  {
    title: 'Nicht jeder legt das vor',
    body: 'Nicht jeder kann Betreibung, Lohn, Ausweis und Referenz als geprüft vorlegen. Genau deshalb unterscheidet das Zertifikat.',
  },
  {
    title: 'Nutzbar, bevor alles vorliegt',
    body: 'Die Referenz des bisherigen Vermieters braucht oft zwei Wochen. Das PDF kannst du trotzdem beilegen — mit dem Stand, der bereits geprüft ist.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
