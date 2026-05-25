/**
 * Zentrale Quelle der Wahrheit fuer das Wohnen-Erfolgsmodell.
 *
 * - Vermittlungsentgelt (Vermieter): Erfolgsprovision auf Basis der ersten
 *   Netto-Monatsmiete, mit Mindestbetrag und Plafonierung.
 * - Mieter-Einzugsbonus: freiwillige Leistung von Helvenda an die ueber
 *   Helvenda Wohnungen vermittelte Person nach erfolgtem Einzug.
 *
 * AGB-Verweise: AGB Ziff. 1.5.8 / 1.5.9, Gebuehrenreglement Ziff. 2.4.
 *
 * Wenn Provision oder Bonus angepasst werden, wird ausschliesslich diese
 * Datei geaendert; Plattform-UI, Marketing-Bloecke und Sales-Materialien
 * konsumieren die Werte ueber die unten exportierten Helper.
 */

export const WOHNEN_LANDLORD_COMMISSION_PERCENT = 33
export const WOHNEN_LANDLORD_COMMISSION_MIN_CHF = 290
export const WOHNEN_LANDLORD_COMMISSION_CAP_CHF = 990

export const WOHNEN_TENANT_MOVEIN_BONUS_CHF = 250

/** Anzahl Tage nach Mietbeginn, ab denen der Mieter-Einzugsbonus ausgezahlt werden kann. */
export const WOHNEN_TENANT_MOVEIN_BONUS_HOLD_DAYS = 30

/** Schutzfrist (Monate) gegen Umgehung des Vermittlungsentgelts. */
export const WOHNEN_LANDLORD_PROTECTION_MONTHS = 6

function formatChf(value: number): string {
  return `CHF ${value.toLocaleString('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function formatLandlordCommissionRangeChf(): string {
  return `${formatChf(WOHNEN_LANDLORD_COMMISSION_MIN_CHF)}–${formatChf(WOHNEN_LANDLORD_COMMISSION_CAP_CHF)}`
}

export function formatTenantBonusChf(): string {
  return formatChf(WOHNEN_TENANT_MOVEIN_BONUS_CHF)
}

export function formatLandlordCapChf(): string {
  return formatChf(WOHNEN_LANDLORD_COMMISSION_CAP_CHF)
}

/**
 * Berechnet die effektive Erfolgsprovision (ohne MwSt) fuer eine gegebene
 * Netto-Monatsmiete in CHF, inkl. Mindestbetrag und Plafonierung.
 */
export function calculateLandlordCommissionChf(netMonthlyRentChf: number): number {
  if (!Number.isFinite(netMonthlyRentChf) || netMonthlyRentChf <= 0) return 0
  const raw = (netMonthlyRentChf * WOHNEN_LANDLORD_COMMISSION_PERCENT) / 100
  const withMin = Math.max(raw, WOHNEN_LANDLORD_COMMISSION_MIN_CHF)
  const withCap = Math.min(withMin, WOHNEN_LANDLORD_COMMISSION_CAP_CHF)
  return Math.round(withCap)
}
