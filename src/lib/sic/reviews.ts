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
    body: 'Der Vermieter sieht geprüfte Angaben in einheitlicher Form — nicht ungeprüfte Unterlagen. Nachvollziehbar per QR. Keine behördliche Auskunft.',
  },
  {
    title: 'Nicht jeder legt das vor',
    body: 'Nicht alle Bewerber reichen Betreibung, Lohn, Ausweis und Referenz als «GEPRÜFT» ein. Das Zertifikat macht den Unterschied sofort sichtbar.',
  },
  {
    title: 'Nutzbar, bevor alles vorliegt',
    body: 'Auch wenn die Vermieter-Referenz länger dauert: Das PDF ist mit dem bereits geprüften Stand verfügbar. So kann der Vermieter nicht unnötig warten.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
