import { sicPaths } from '@/lib/sic/config'
import { SIC_VALIDITY_MONTHS, SIC_WORKING_NOTICE } from '@/lib/sic/modules'

export type SicLandlordExplainerItem = {
  title: string
  body: string
}

export type SicLandlordExplainerCopy = {
  kicker: string
  lead: string
  workingNote: string | null
  items: SicLandlordExplainerItem[]
  kiNote: string
  agbHref: string
  datenschutzHref: string
}

/**
 * Fünf Sätze für den Vermieter auf der QR-Prüfseite.
 * Aussteller-Ton, an die AGB gekoppelt: Plausibilität, kein Amt, kein Anruf,
 * fehlende Angabe ≠ negativ, 3×-Regel, Gültigkeit am Auszug.
 */
export function sicLandlordExplainerCopy(opts: {
  completenessLabel: string
  sealed: boolean
}): SicLandlordExplainerCopy {
  return {
    kicker: 'Für Vermieterinnen und Vermieter',
    lead:
      'Du siehst Angaben aus eingereichten Unterlagen — plausibel geprüft, standardisiert, hier nachvollziehbar. Keine behördliche Auskunft.',
    workingNote: opts.sealed ? null : SIC_WORKING_NOTICE,
    items: [
      {
        title: 'Was geprüft ist',
        body:
          'Nur die aufgeführten Angaben. Die Unterlagen werden auf Vollständigkeit, Aktualität und Plausibilität kontrolliert; die Freigabe erfolgt durch einen Menschen. Auf dem Dokument stehen Kategorien und Bestätigungen, keine Kopien der Belege.',
      },
      {
        title: 'Was nicht geprüft ist',
        body:
          'Wir rufen niemanden an — weder Arbeitgeber noch bisherigen Vermieter — und holen keine Auskünfte bei Ämtern ein. Das Dokument ist keine Bonitätsbewertung und keine Empfehlung. Ob du die Person nimmst, entscheidest du allein.',
      },
      {
        title: `Was «${opts.completenessLabel}» bedeutet`,
        body:
          'Nur die aufgeführten Angaben sind geprüft. Nicht aufgeführte Angaben wurden nicht geprüft — das ist kein Negativbefund.',
      },
      {
        title: '3×-Regel',
        body:
          'Steht ein Einkommensband da, ist die tragbare Monatsmiete aus dem unteren Bandrand gerechnet. Bei zwei Personen zählt die Summe. Der exakte Lohn steht nie da.',
      },
      {
        title: 'Gültigkeit',
        body: `«Gültig bis» hängt am Datum des Betreibungsauszugs — ${SIC_VALIDITY_MONTHS} Monate. Andere Angaben verlängern die Frist nicht. Bei zwei Personen gilt der ältere der beiden Auszüge.`,
      },
    ],
    kiNote:
      'Zur Vorbereitung liest ein KI-Dienst die Unterlagen aus; bindend ist erst die menschliche Freigabe.',
    agbHref: sicPaths.agb,
    datenschutzHref: sicPaths.datenschutz,
  }
}
