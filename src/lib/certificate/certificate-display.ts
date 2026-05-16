export function formatMaxRentMonthlyChf(amount: number): string {
  return `Empfohlene Maximalmiete (3×-Regel): CHF ${amount.toLocaleString('de-CH')} / Monat`
}

export const CERTIFICATE_LANDLORD_BANNER_DE =
  'Für Vermieter: Betreibungsregisterauszug am Stichtag geprüft · Haushaltsnetto monatlich (Kategorie, Mieterprofil) · Beschäftigung erfasst · Maximalmiete nach üblicher 3×-Regel · Echtheit und Gültigkeit per QR oder Link prüfen.'

/** Kürzere Variante für einseitiges PDF. */
export const CERTIFICATE_LANDLORD_BANNER_PDF_DE =
  'Betreibung geprüft · Haushaltsnetto/Monat (Kategorie) · Beschäftigung erfasst · 3×-Miete · Echtheit per QR prüfen.'

export const CERTIFICATE_HERO_PROMISE_DE =
  'Nachweis für die Wohnungssuche: geprüfter Betreibungsauszug plus gebündeltes Mieterprofil — online verifizierbar, ohne Papierkrieg bei jeder Bewerbung.'

export const CERTIFICATE_HERO_PROMISE_PDF_DE =
  'Geprüfter Betreibungsauszug und gebündeltes Mieterprofil — online verifizierbar.'

export const CERTIFICATE_FOOTNOTE_DE =
  'Stand zum Ausstellungsdatum. Betreibungsregister: Auszug durch Helvenda plausibilisiert. Haushaltsnetto und Beschäftigung: Angaben aus dem verifizierten Mieterprofil. Bei Zweifeln aktuellen Auszug oder Kontakt zum Bewerber anfordern.'

export const CERTIFICATE_FOOTNOTE_PDF_DE =
  'Stand bei Ausstellung: Betreibungsregister geprüft; Haushaltsnetto und Beschäftigung aus Mieterprofil. Bei Zweifeln aktuellen Auszug anfordern.'

export type CertificateFieldBadge = 'verified' | 'captured'

export const CERTIFICATE_FIELD_BADGE_LABEL: Record<CertificateFieldBadge, string> = {
  verified: 'Geprüft',
  captured: 'Erfasst',
}
