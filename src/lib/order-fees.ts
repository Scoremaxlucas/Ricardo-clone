/**
 * Berechnet die Gebühren für eine Order (Zahlungsschutz)
 *
 * WICHTIG: Wie bei Ricardo MoneyGuard zahlt der Käufer NUR den Artikelpreis + Versand.
 * Der Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr für den Käufer).
 * Die Plattform-Gebühr wird vom Verkäufer bezahlt (bei der Auszahlung abgezogen).
 *
 * Verwendet die zentrale Pricing-Konfiguration aus pricing-config.ts
 */

import { calculatePlatformFee } from './pricing-config'

export interface OrderFeeCalculation {
  itemPrice: number
  shippingCost: number
  platformFee: number      // Wird vom Verkäufer bezahlt (nicht vom Käufer!)
  protectionFee: number    // Immer 0 - Zahlungsschutz ist inklusive
  totalAmount: number      // Was der Käufer zahlt: itemPrice + shippingCost
}

/**
 * Berechnet alle Gebühren für eine Order
 *
 * RICARDO-MODELL: Käufer zahlt NUR Artikelpreis + Versand
 * - Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr)
 * - Plattform-Gebühr wird vom Verkäufer bezahlt (bei Auszahlung abgezogen)
 *
 * @param itemPrice - Der Artikelpreis
 * @param shippingCost - Die Versandkosten
 * @param _includeProtectionFee - DEPRECATED: Wird ignoriert, Zahlungsschutz ist immer inklusive
 * @param customConfig - Optionale benutzerdefinierte Pricing-Konfiguration
 */
export async function calculateOrderFees(
  itemPrice: number,
  shippingCost: number,
  _includeProtectionFee: boolean = true, // DEPRECATED - kept for backwards compatibility
  customConfig?: Partial<import('./pricing-config').PricingConfig>
): Promise<OrderFeeCalculation> {
  // Plattform-Gebühr (wird vom Verkäufer bezahlt, nicht vom Käufer)
  const platformFee = await calculatePlatformFee(itemPrice, customConfig)

  // Zahlungsschutz ist INKLUSIVE - keine zusätzliche Gebühr für den Käufer
  const protectionFee = 0

  // KÄUFER zahlt NUR: Artikelpreis + Versandkosten
  // (Plattform-Gebühr wird bei der Auszahlung an den Verkäufer abgezogen)
  const totalAmount = Math.round((itemPrice + shippingCost) * 100) / 100

  return {
    itemPrice,
    shippingCost,
    platformFee,      // Für interne Berechnung (Verkäufer-Auszahlung)
    protectionFee,    // Immer 0 - Zahlungsschutz inklusive
    totalAmount,      // Was der Käufer zahlt
  }
}

/**
 * Berechnet den Betrag, der an den Verkäufer überwiesen wird
 * (Item-Preis - Plattform-Gebühr)
 */
export function calculateSellerAmount(itemPrice: number, platformFee: number): number {
  return Math.round((itemPrice - platformFee) * 100) / 100
}
