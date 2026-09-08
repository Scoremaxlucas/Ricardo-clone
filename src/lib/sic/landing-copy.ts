import {
  formatSicChf,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicIsFree,
} from '@/lib/sic/modules'

const IS_FREE = sicIsFree()

export const SIC_PRICE_LABEL = IS_FREE ? 'Kostenlos' : formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)

/** In den ersten Sekunden: was es ist, für wen, ohne Portal-Abo. */
export const SIC_PRODUCT_LINE =
  'Geprüftes Mieter-Zertifikat für Bewerbungen in der Schweiz — einmal anlegen, jeder Bewerbung beilegen. Kein Pflicht-Abo für Mieter.'

export const SIC_OFFER_TERMS =
  IS_FREE ?
    `Kostenlos. Kein Abo. ${SIC_VALIDITY_MONTHS} Monate gültig — gerechnet ab dem Betreibungsauszug.`
  : `${SIC_PRICE_LABEL} · alle ${SIC_MODULES.length} Angaben. Einmalig, kein Abo. ${SIC_VALIDITY_MONTHS} Monate gültig — gerechnet ab dem Betreibungsauszug. Verlängerung ${formatSicChf(SIC_RENEWAL_FEE_CHF)}.`

/** Was nach dem Anlegen selbst zu beschaffen ist — vor dem Kauf sichtbar. */
export const SIC_PREP_ITEMS = [
  'Betreibungsauszug',
  'Ausweis',
  'Lohnabrechnung und Unterschrift des Arbeitgebers',
  'Unterschrift des bisherigen Vermieters',
] as const

/**
 * «Die Ausgangslage» — warum es das Zertifikat braucht.
 *
 * Wir behaupten *nicht*, dass wir „strenger prüfen als andere“. Ehrlich ist:
 * Auch bei uns liegt am Ende ein PDF vor, und wir prüfen die Unterlagen, die
 * *tatsächlich vorgelegt* werden. Der wahre Nutzen ist ein anderer:
 *  1. der Markt: Vermieter sichten in Minuten, nicht Stunden,
 *  2. das Signal: wer sich prüfen lässt, meint es ernst,
 *  3. das Format: eine standardisierte, per QR nachvollziehbare Datei statt
 *     einer Sammlung loser Anhänge.
 * Kein Sales-Pitch gegen „Selbstauskunft“ — das wäre für uns dieselbe Falle.
 */
export const SIC_TODAY_SCENES = [
  'Auf attraktive Wohnungen kommen dutzende bis hunderte Bewerbungen. Der Vermieter sichtet in Minuten — nicht in Stunden.',
  'Was in der ersten Runde fehlt, wird selten nachgefragt. Wer erst später belegen kann, dass er zahlt und passt, ist meistens schon aussortiert.',
  'Ein Zertifikat legt in einer Datei vor, was er sonst zusammensuchen müsste: Betreibungsauszug, Ausweis, Lohn im Rahmen der 3×-Regel, Vermieter-Referenz — einheitlich und per QR nachvollziehbar.',
] as const

/** Abschlusssatz zur «Ausgangslage» — ohne die Anmassung, andere seien Selbstauskunft. */
export const SIC_TODAY_CLOSING =
  'Ein SIC-Zertifikat weist aus, was du tatsächlich vorgelegt hast. Es entsteht nur, wenn Unterlagen wirklich eingereicht und geprüft wurden — nicht auf Zuruf.'

/** Öffentliche Prüfer-Angabe — Landing, nicht Zertifikat. */
export const SIC_REVIEWER = {
  name: 'Lucas Rodrigues',
  role: 'Prüfung',
} as const

export const SIC_TRUST_FACTS = [
  {
    title: 'Ein Mensch gibt frei',
    body: 'Eine KI liest die Unterlagen zur Vorbereitung aus. Freigeben tut immer ein Mensch — keine automatisierte Entscheidung.',
  },
  {
    title: 'Keine Behörde, keine Empfehlung',
    body: 'Wir prüfen auf Vollständigkeit und Plausibilität. Das Zertifikat ist keine amtliche Auskunft und keine Wohnungszusage.',
  },
  {
    title: 'Unabhängig vom Portal',
    body: 'Du legst das PDF der Bewerbung bei — per E-Mail, direkt oder über ein Portal. Der Vermieter sieht die Angaben per QR, nicht deine Original-Dokumente.',
  },
] as const
