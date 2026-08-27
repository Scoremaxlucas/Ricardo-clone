/**
 * Beispielszenarien für die Landing — ausdrücklich fiktiv.
 * Keine Kundenstimmen, bis echte Zitate mit Einwilligung vorliegen.
 */
export type SicScenario = {
  quote: string
  name: string
  initials: string
  place: string
}

export const SIC_SCENARIOS: readonly SicScenario[] = [
  {
    quote:
      'Statt fünf Anhänge lege ich das PDF bei. Der Vermieter scannt den QR und sieht, welche Angaben geprüft sind.',
    name: 'Lara M.',
    initials: 'LM',
    place: 'Zürich',
  },
  {
    quote:
      'Betreibungsauszug und Lohnabrechnung muss ich nicht mehr einzeln erklären. Auf dem Zertifikat steht, was geprüft wurde.',
    name: 'Marco S.',
    initials: 'MS',
    place: 'Bern',
  },
  {
    quote:
      'Die Referenz vom bisherigen Vermieter dauert oft zwei Wochen. Mit den schon geprüften Angaben kann ich das PDF trotzdem beilegen.',
    name: 'Sofie K.',
    initials: 'SK',
    place: 'Basel',
  },
] as const
