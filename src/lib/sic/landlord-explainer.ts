import { sicPaths } from '@/lib/sic/config'
import {
  SIC_DECLARED_BADGE,
  SIC_MODULE_BADGE,
  SIC_MODULES,
  SIC_NO_PRIOR_REFERENCE_LINE,
  SIC_PLAUSIBILITY_FOOTER,
  SIC_UNCHECKED_LINE,
  SIC_UNSEALED_NOTE,
  SIC_VALIDITY_MONTHS,
  sicCompletenessLabel,
  sicSealRequirementLabel,
} from '@/lib/sic/modules'

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
  /** Ausführliche Erklärung: die Vermieter-Seite. */
  guideHref: string
  guideLabel: string
  agbHref: string
  datenschutzHref: string
}

/**
 * Bausteine — eine Quelle für die QR-Prüfseite (kurz, neben dem Zertifikat) und
 * die Vermieter-Seite (ausführlich). Wortlaut hier ändern, nicht in den Seiten.
 */
const KICKER = 'Für Vermieterinnen und Vermieter'

const LEAD =
  'Du siehst Angaben aus eingereichten Unterlagen — plausibel geprüft, standardisiert, hier nachvollziehbar. Keine behördliche Auskunft.'

const CHECKED: SicLandlordExplainerItem = {
  title: 'Was geprüft ist',
  body: `Nur die mit «${SIC_MODULE_BADGE}» markierten Angaben. Die Unterlagen werden auf Vollständigkeit, Aktualität und Plausibilität kontrolliert; die Freigabe erfolgt durch einen Menschen. Auf dem Dokument stehen Kategorien und Bestätigungen, keine Kopien der Belege.`,
}

const NOT_CHECKED: SicLandlordExplainerItem = {
  title: 'Was nicht geprüft ist',
  body:
    'Wir rufen niemanden an — weder Arbeitgeber noch bisherigen Vermieter — und holen keine Auskünfte bei Ämtern ein. Das Dokument ist keine Bonitätsbewertung und keine Empfehlung. Ob du die Person nimmst, entscheidest du allein.',
}

const SCOPE_BODY = `Nur die mit «${SIC_MODULE_BADGE}» markierten Angaben sind geprüft. Steht bei einer Angabe «${SIC_UNCHECKED_LINE}», wurde sie nicht geprüft — das ist kein Negativbefund.`

/** Vier Fälle, in dieser Reihenfolge — die Prüfseite setzt sie zu einem Absatz zusammen. */
const DEBT_CASES: readonly string[] = [
  '«Keine Einträge» heisst: der Auszug ist leer.',
  '«Keine offenen Betreibungen» heisst: frühere Einträge sind erledigt.',
  'Steht eine offene Betreibung da, hat die Person der Ausweisung zugestimmt — höchstens zwei, zusammen unter CHF 1’000, als Betragsstufe.',
  'Verlustscheine werden nie freigegeben.',
]

const DEBTS: SicLandlordExplainerItem = {
  title: 'Betreibungen',
  body: DEBT_CASES.join(' '),
}

const RENT_RULE: SicLandlordExplainerItem = {
  title: '3×-Regel',
  body:
    'Steht ein Einkommensband da, ist der Richtwert für die Monatsmiete aus dem unteren Bandrand gerechnet: ein Drittel des Monatslohns. Bei zwei Personen zählt die Summe. Der exakte Lohn steht nie da. Ein Richtwert, keine Empfehlung.',
}

const VALIDITY: SicLandlordExplainerItem = {
  title: 'Gültigkeit',
  body: `«Gültig bis» hängt am Datum des Betreibungsauszugs — ${SIC_VALIDITY_MONTHS} Monate. Andere Angaben verlängern die Frist nicht. Bei zwei Personen gilt der ältere der beiden Auszüge. Läuft ein Ausweis früher ab, endet das Zertifikat mit dem Ausweis. Ist der Auszug noch nicht geprüft, gilt eine vorläufige Frist von ${SIC_VALIDITY_MONTHS} Monaten ab der ersten Freigabe.`,
}

const KI_NOTE =
  'Zur Vorbereitung liest ein KI-Dienst die Unterlagen aus; bindend ist erst die menschliche Freigabe.'

/**
 * Titel der Prüfseite je Zustand — dieselben Wörter erklärt die Vermieter-Seite.
 */
export const SIC_VERIFY_STATE_TITLES = {
  unknown: 'Kein Zertifikat gefunden',
  replaced: 'Ersetzt',
  revoked: 'Widerrufen',
  expired: 'Abgelaufen',
} as const

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
    kicker: KICKER,
    lead: LEAD,
    workingNote: opts.sealed ? null : SIC_UNSEALED_NOTE,
    items: [
      CHECKED,
      NOT_CHECKED,
      { title: `Was «${opts.completenessLabel}» bedeutet`, body: SCOPE_BODY },
      DEBTS,
      RENT_RULE,
      VALIDITY,
    ],
    kiNote: KI_NOTE,
    guideHref: sicPaths.landlords,
    guideLabel: 'So liest du ein Mieter-Zertifikat',
    agbHref: sicPaths.agb,
    datenschutzHref: sicPaths.datenschutz,
  }
}

export type SicLandlordGuideSection = {
  id: string
  title: string
  paragraphs: string[]
  /** Aufzählung ohne Stichwort (Fälle). */
  bullets?: readonly string[]
  /** Unterpunkte mit eigenem Stichwort (Zustände der Prüfseite). */
  points?: readonly SicLandlordExplainerItem[]
}

export type SicLandlordGuideCopy = {
  kicker: string
  title: string
  lead: string
  /** Bildlegende zum Beispiel-Zertifikat. */
  exampleCaption: string
  sections: SicLandlordGuideSection[]
  kiNote: string
  faqHref: string
  agbHref: string
  datenschutzHref: string
}

/** Auf dem Beispiel der Vermieter-Seite nicht geprüft — zeigt die neutrale Zeile. */
export const SIC_LANDLORD_GUIDE_EXAMPLE_UNCHECKED = ['ZUVERLAESSIGKEIT'] as const

/**
 * Die Vermieter-Seite: dieselben Aussagen wie auf der Prüfseite, dazu Siegel,
 * Selbstangaben und die Zustände der Prüfseite. Informiert — verkauft nichts.
 */
export function sicLandlordGuideCopy(): SicLandlordGuideCopy {
  const moduleTitles = SIC_MODULES.map(m => m.title).join(', ')
  const exampleLabel = sicCompletenessLabel(
    SIC_MODULES.length - SIC_LANDLORD_GUIDE_EXAMPLE_UNCHECKED.length
  )

  return {
    kicker: KICKER,
    title: 'So liest du ein Mieter-Zertifikat',
    lead: LEAD,
    exampleCaption: `Beispiel mit erfundenen Werten: «${exampleLabel}». Die vierte Angabe steht neutral als «${SIC_UNCHECKED_LINE}» da.`,
    sections: [
      {
        id: 'was-es-ist',
        title: 'Was das Mieter-Zertifikat ist',
        paragraphs: [
          `Ein einheitliches Dokument, das zusammenfasst, was eine Bewerberin oder ein Bewerber mit eigenen Unterlagen belegt hat — bis zu ${SIC_MODULES.length} Angaben: ${moduleTitles}.`,
        ],
        points: [CHECKED],
      },
      {
        id: 'was-es-nicht-ist',
        title: 'Was es nicht ist',
        paragraphs: [
          SIC_PLAUSIBILITY_FOOTER,
          'Es ist auch keine Zusage und keine Garantie — weder dafür, dass die Miete bezahlt wird, noch dafür, wie das Mietverhältnis verläuft.',
        ],
        points: [NOT_CHECKED],
      },
      {
        id: 'markierungen',
        title: `«${SIC_MODULE_BADGE}» und «${SIC_UNCHECKED_LINE}»`,
        paragraphs: [
          SCOPE_BODY,
          `Oben auf dem Zertifikat steht der Umfang, zum Beispiel «${exampleLabel}». Jedes Dokument mit mindestens einer geprüften Angabe ist ein gültiges Mieter-Zertifikat — für genau diese Angaben.`,
          `Steht «${SIC_DECLARED_BADGE}» statt «${SIC_MODULE_BADGE}», ist es eine Selbstangabe der Person, zum Beispiel «${SIC_NO_PRIOR_REFERENCE_LINE}» Sie ist vermerkt, nicht geprüft.`,
        ],
      },
      {
        id: 'siegel',
        title: 'Was das Siegel aussagt',
        paragraphs: [
          `Das Siegel steht auf dem Zertifikat, wenn ${sicSealRequirementLabel()} beide geprüft sind. Es zeichnet diese zwei Angaben aus — es ist kein Gütesiegel für die Person und sagt nichts über die übrigen Angaben.`,
          SIC_UNSEALED_NOTE,
        ],
      },
      {
        id: 'betreibungen',
        title: DEBTS.title,
        paragraphs: [
          'Auf dem Zertifikat steht eine von wenigen festen Formulierungen, dazu Datum und Amt des Auszugs.',
        ],
        bullets: DEBT_CASES,
      },
      {
        id: 'drei-mal-regel',
        title: RENT_RULE.title,
        paragraphs: [RENT_RULE.body],
      },
      {
        id: 'gueltigkeit',
        title: VALIDITY.title,
        paragraphs: [VALIDITY.body],
      },
      {
        id: 'verifizieren',
        title: 'Echtheit prüfen: QR-Code oder Prüf-Link',
        paragraphs: [
          'Jedes Zertifikat trägt einen QR-Code und einen Code der Form «SIC-2026-…». Scanne den QR-Code oder öffne den Prüf-Link — die Prüfseite zeigt den aktuellen Stand direkt bei uns, ohne Anmeldung.',
          'Vergleiche Name, Angaben und Datum mit dem PDF, das du erhalten hast. Massgebend ist die Prüfseite: Ein Zertifikat gilt, solange sie es als gültig ausweist.',
        ],
        points: [
          {
            title: 'Gültig',
            body: 'Die Prüfseite zeigt Name, Umfang, die geprüften Angaben und «Gültig bis».',
          },
          {
            title: SIC_VERIFY_STATE_TITLES.replaced,
            body:
              'Die Person hat einen neuen Code erzeugt — etwa, weil ein Link ungewollt in Umlauf kam. Der alte Code zeigt keine Angaben mehr und nennt den neuen nicht. Das ist kein Negativbefund; bitte die Person um den aktuellen Stand.',
          },
          {
            title: SIC_VERIFY_STATE_TITLES.revoked,
            body:
              'Wir haben das Zertifikat zurückgezogen — zum Beispiel, weil Unterlagen nicht echt oder nicht die eigenen waren, oder weil der Kauf rückabgewickelt wurde. Der Code ist nicht mehr gültig.',
          },
          {
            title: SIC_VERIFY_STATE_TITLES.expired,
            body: 'Die Gültigkeit ist vorbei. Der Code weist keine Angaben mehr aus.',
          },
          {
            title: SIC_VERIFY_STATE_TITLES.unknown,
            body:
              'Zu diesem Code gibt es kein Zertifikat. Stimmt die Schreibweise, ist das Dokument nicht von uns ausgestellt.',
          },
        ],
      },
    ],
    kiNote: KI_NOTE,
    faqHref: sicPaths.faq,
    agbHref: sicPaths.agb,
    datenschutzHref: sicPaths.datenschutz,
  }
}
