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
    title: 'Ernst genommen statt übergangen',
    body: 'Der Vermieter kann sich auf geprüfte Angaben stützen — nicht auf Selbstauskunft. Du bist nicht mehr dieselbe Wette wie jeder andere Ordner.',
  },
  {
    title: 'Nur wer sich prüfen lässt',
    body: 'Betreibung, Lohn, Ausweis, Referenz: den Aufwand nimmt nicht jeder auf sich. Das Zertifikat haben die seriösen Bewerber. Genau deshalb zählt es.',
  },
  {
    title: 'Nicht warten auf die letzte Unterschrift',
    body: 'Die Referenz vom bisherigen Vermieter dauert oft zwei Wochen. Du kannst das PDF trotzdem schon beilegen — mit dem, was schon geprüft ist.',
  },
]

export function sicLandingHasReviews(): boolean {
  return SIC_REVIEWS.length > 0
}
