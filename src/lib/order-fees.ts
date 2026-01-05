/**
 * Berechnet die Gebühren für eine Order (Zahlungsschutz)
 *
 * HELVENDA-MODELL (günstiger als Ricardo):
 * ===========================================
 * - Käufer zahlt NUR Artikelpreis + Versand (Zahlungsschutz inklusive!)
 * - Verkäufer zahlt:
 *   1. Plattform-Gebühr: 5% (max. CHF 150)
 *   2. Zahlungsgebühr (Helvenda Schutz Gebühr): Stripe Fee (2.9% + 0.30)
 *
 * Vergleich mit Ricardo:
 * - Ricardo: 8-12%, max CHF 290, Gebühren inkl.
 * - Helvenda: 5%, max CHF 150 + Zahlungsgebühr (ca. 40% günstiger!)
 *
 * Verwendet die zentrale Pricing-Konfiguration aus pricing-config.ts
 */

import { calculatePlatformFee, calculateStripeFee } from './pricing-config'

export interface OrderFeeCalculation {
  itemPrice: number
  shippingCost: number
  platformFee: number           // 5% Kommission (max CHF 150) - vom Verkäufer bezahlt
  paymentProcessingFee: number  // Stripe Fee (2.9% + 0.30) - "Helvenda Schutz Gebühr"
  protectionFee: number         // Immer 0 - Zahlungsschutz ist inklusive für Käufer
  totalAmount: number           // Was der Käufer zahlt: itemPrice + shippingCost
  sellerReceives: number        // Was der Verkäufer erhält (nach allen Abzügen)
  totalSellerFees: number       // Gesamte Gebühren für Verkäufer (Kommission + Zahlungsgebühr)
}

/**
 * Berechnet alle Gebühren für eine Order
 *
 * HELVENDA-MODELL: Käufer zahlt NUR Artikelpreis + Versand
 * - Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr für Käufer)
 * - Verkäufer zahlt: 5% Kommission + Zahlungsgebühr (Stripe Fee)
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
  // 1. Plattform-Gebühr: 5% (max CHF 150) - vom Verkäufer bezahlt
  const platformFee = await calculatePlatformFee(itemPrice, customConfig)

  // 2. Zahlungsgebühr (Helvenda Schutz Gebühr): Stripe Fee auf Gesamtbetrag
  const totalBuyerPays = itemPrice + shippingCost
  const paymentProcessingFee = calculateStripeFee(totalBuyerPays)

  // Zahlungsschutz ist INKLUSIVE - keine zusätzliche Gebühr für den Käufer
  const protectionFee = 0

  // KÄUFER zahlt NUR: Artikelpreis + Versandkosten
  const totalAmount = Math.round(totalBuyerPays * 100) / 100

  // VERKÄUFER erhält: Artikelpreis - Kommission - Zahlungsgebühr
  const totalSellerFees = Math.round((platformFee + paymentProcessingFee) * 100) / 100
  const sellerReceives = Math.round((itemPrice - platformFee - paymentProcessingFee) * 100) / 100

  return {
    itemPrice,
    shippingCost,
    platformFee,              // 5% Kommission (max CHF 150)
    paymentProcessingFee,     // Stripe Fee ("Helvenda Schutz Gebühr")
    protectionFee,            // Immer 0 - Zahlungsschutz inklusive für Käufer
    totalAmount,              // Was der Käufer zahlt
    sellerReceives,           // Was der Verkäufer nach Abzügen erhält
    totalSellerFees,          // Gesamte Gebühren für Verkäufer
  }
}

/**
 * Berechnet den Betrag, der an den Verkäufer überwiesen wird
 * WICHTIG: Jetzt inkl. Abzug der Zahlungsgebühr (Stripe Fee)
 *
 * @param itemPrice - Der Artikelpreis
 * @param platformFee - Die Plattform-Gebühr (5%, max CHF 150)
 * @param paymentProcessingFee - Die Zahlungsgebühr (Stripe Fee)
 */
export function calculateSellerAmount(
  itemPrice: number,
  platformFee: number,
  paymentProcessingFee: number = 0
): number {
  return Math.round((itemPrice - platformFee - paymentProcessingFee) * 100) / 100
}
