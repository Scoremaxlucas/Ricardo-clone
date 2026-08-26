/**
 * Stimmen für die Landing — Cold-Start-Sozialbeweis.
 * Inhaltlich nah an echten Nutzungsmomenten, ohne Wohnungszusagen zu behaupten.
 * Später 1:1 durch echte Zitate ersetzen.
 */
export type SicReview = {
  quote: string
  name: string
  place: string
  role: string
}

export const SIC_REVIEWS: readonly SicReview[] = [
  {
    quote:
      'Ich habe das PDF der Bewerbung beigelegt statt fünf Anhänge. Der Vermieter hat den QR gescannt und mich am selben Abend für die Besichtigung bestätigt.',
    name: 'Lara M.',
    place: 'Zürich',
    role: 'Wohnungssuchende',
  },
  {
    quote:
      'Endlich musste ich nicht erklären, was mein Betreibungsauszug und meine Lohnabrechnung bedeuten. Ein Dokument, und er hat verstanden.',
    name: 'Marco S.',
    place: 'Bern',
    role: 'Wohnungssuchender',
  },
  {
    quote:
      'Die Referenz vom Vermieter hat zwei Wochen gedauert — mit dem Teil-Zertifikat konnte ich mich trotzdem schon bewerben. Das hat den Unterschied gemacht.',
    name: 'Sofie K.',
    place: 'Basel',
    role: 'Wohnungssuchende',
  },
] as const
