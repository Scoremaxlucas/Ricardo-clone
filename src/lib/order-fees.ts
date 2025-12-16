/**
 * Berechnet die Gebühren für eine Order (Zahlungsschutz)
 *
 * Verwendet die zentrale Pricing-Konfiguration aus pricing-config.ts
 */

import { getPricingConfig, calculatePlatformFee, calculateProtectionFee } from './pricing-config'

export interface OrderFeeCalculation {
  itemPrice: number
  shippingCost: number
  platformFee: number
  protectionFee: number
  totalAmount: number
}

/**
 * Berechnet alle Gebühren für eine Order
 *
 * @param itemPrice - Der Artikelpreis
 * @param shippingCost - Die Versandkosten
 * @param includeProtectionFee - Ob die Zahlungsschutz-Gebühr eingerechnet werden soll
 * @param customConfig - Optionale benutzerdefinierte Pricing-Konfiguration
 */
export function calculateOrderFees(
  itemPrice: number,
  shippingCost: number,
  includeProtectionFee: boolean = true,
  customConfig?: Partial<import('./pricing-config').PricingConfig>
): OrderFeeCalculation {
  // Plattform-Gebühr (verwendet zentrale Pricing-Konfiguration)
  const platformFee = calculatePlatformFee(itemPrice, customConfig)

  // Zahlungsschutz-Gebühr (optional)
  const protectionFee = includeProtectionFee
    ? calculateProtectionFee(itemPrice, customConfig)
    : 0

  // Gesamtbetrag
  const totalAmount = Math.round((itemPrice + shippingCost + platformFee + protectionFee) * 100) / 100

  return {
    itemPrice,
    shippingCost,
    platformFee,
    protectionFee,
    totalAmount,
  }
}

/**
 * Berechnet den Betrag, der an den Verkäufer überwiesen wird
 * (Item-Preis - Plattform-Gebühr)
 */
export function calculateSellerAmount(itemPrice: number, platformFee: number): number {
  return Math.round((itemPrice - platformFee) * 100) / 100
}
