export function formatMaxRentMonthlyChf(amount: number): string {
  return `Empfohlene Maximalmiete (3×-Regel): CHF ${amount.toLocaleString('de-CH')} / Monat`
}

export const CERTIFICATE_LANDLORD_BANNER_DE =
  'Für Vermieter: Betreibungsregisterauszug am Stichtag geprüft · Haushaltsnetto monatlich (Kategorie, Mieterprofil) · Beschäftigung erfasst · Maximalmiete nach üblicher 3×-Regel · Echtheit und Gültigkeit per QR oder Link prüfen.'

export const CERTIFICATE_HERO_PROMISE_DE =
  'Nachweis für die Wohnungssuche: geprüfter Betreibungsauszug plus gebündeltes Mieterprofil — online verifizierbar, ohne Papierkrieg bei jeder Bewerbung.'

export const CERTIFICATE_FOOTNOTE_DE =
  'Stand zum Ausstellungsdatum. Betreibungsregister: Auszug durch Helvenda plausibilisiert. Haushaltsnetto und Beschäftigung: Angaben aus dem verifizierten Mieterprofil. Bei Zweifeln aktuellen Auszug oder Kontakt zum Bewerber anfordern.'

export type CertificateFieldBadge = 'verified' | 'captured'

export const CERTIFICATE_FIELD_BADGE_LABEL: Record<CertificateFieldBadge, string> = {
  verified: 'Geprüft',
  captured: 'Erfasst',
}
