/**
 * Berechnet die Gebühren für eine Order (Zahlungsschutz)
 *
 * HELVENDA-MODELL (günstiger als Ricardo):
 * ===========================================
 * - Käufer zahlt NUR Artikelpreis + Versand (Zahlungsschutz inklusive!)
 * - Verkäufer zahlt:
 *   1. Plattform-Gebühr: 5% (max. CHF 150)
 *   2. Zahlungsgebühr: Kombinierte Stripe-Gebühr (Processing + Payout)
 *
 * VEREINFACHUNG:
 * Beide Stripe-Gebühren (Processing 2.9%+0.30 und Payout 0.25%+0.55)
 * werden zu EINER "Zahlungsgebühr" kombiniert und dem Verkäufer angezeigt.
 *
 * Verwendet die zentrale Pricing-Konfiguration aus pricing-config.ts
 */

import { calculateCombinedStripeFee, calculatePlatformFee, STRIPE_FEE } from './pricing-config'

export interface OrderFeeCalculation {
  itemPrice: number
  shippingCost: number
  platformFee: number // 5% Kommission (max CHF 150) - vom Verkäufer bezahlt
  paymentProcessingFee: number // Kombinierte Stripe-Gebühr (Processing + Payout) - für Anzeige als "Zahlungsgebühr"
  protectionFee: number // Immer 0 - Zahlungsschutz ist inklusive für Käufer
  totalAmount: number // Was der Käufer zahlt: itemPrice + shippingCost
  sellerReceives: number // Was der Verkäufer NETTO auf dem Bankkonto erhält
  totalSellerFees: number // Gesamte Gebühren für Verkäufer (Kommission + Zahlungsgebühr)
  // Interne Werte für Transfer-Berechnung:
  _processingFeeOnly: number // Nur Processing Fee (für DB-Speicherung und Transfer-Berechnung)
}

/**
 * Berechnet alle Gebühren für eine Order
 *
 * HELVENDA-MODELL: Käufer zahlt NUR Artikelpreis + Versand
 * - Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr für Käufer)
 * - Verkäufer zahlt: 5% Kommission + Zahlungsgebühr (kombinierte Stripe-Gebühr)
 *
 * Die "Zahlungsgebühr" kombiniert beide Stripe-Gebühren:
 * - Processing Fee (2.9% + CHF 0.30) - beim Zahlen
 * - Payout Fee (0.25% + CHF 0.55) - bei Auszahlung
 *
 * Der Verkäufer sieht EINE Gebühr und erhält den angezeigten Betrag netto auf sein Konto.
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

  // 2. Berechne beide Stripe-Gebühren
  const totalBuyerPays = itemPrice + shippingCost

  // Processing Fee (nur diese wird für Transfer-Berechnung benötigt)
  const processingFeeOnly =
    Math.round(
      (totalBuyerPays * STRIPE_FEE.processingPercentage + STRIPE_FEE.processingFixed) * 100
    ) / 100

  // Kombinierte Gebühr (Processing + Payout) - für Anzeige
  const combinedStripeFee = calculateCombinedStripeFee(totalBuyerPays, itemPrice, platformFee)

  // Zahlungsschutz ist INKLUSIVE - keine zusätzliche Gebühr für den Käufer
  const protectionFee = 0

  // KÄUFER zahlt NUR: Artikelpreis + Versandkosten
  const totalAmount = Math.round(totalBuyerPays * 100) / 100

  // VERKÄUFER erhält: Artikelpreis - Kommission - Kombinierte Zahlungsgebühr
  // Dies ist der NETTO-Betrag, der auf dem Bankkonto ankommt (keine versteckten Gebühren mehr!)
  const totalSellerFees = Math.round((platformFee + combinedStripeFee) * 100) / 100
  const sellerReceives = Math.round((itemPrice - platformFee - combinedStripeFee) * 100) / 100

  return {
    itemPrice,
    shippingCost,
    platformFee, // 5% Kommission (max CHF 150)
    paymentProcessingFee: combinedStripeFee, // Kombinierte Stripe-Gebühr ("Zahlungsgebühr") - für UI
    protectionFee, // Immer 0 - Zahlungsschutz inklusive für Käufer
    totalAmount, // Was der Käufer zahlt
    sellerReceives, // Was der Verkäufer NETTO auf dem Bankkonto erhält
    totalSellerFees, // Gesamte Gebühren für Verkäufer
    _processingFeeOnly: processingFeeOnly, // Nur Processing Fee (für DB und Transfer)
  }
}

/**
 * Berechnet den Betrag, den der Verkäufer NETTO auf dem Bankkonto erhält
 * 
 * WICHTIG: Diese Funktion berechnet die kombinierte Stripe-Gebühr automatisch:
 * - Processing Fee (2.9% + CHF 0.30) - bereits in processingFeeOnly enthalten
 * - Payout Fee (0.25% + CHF 0.55) - wird hier berechnet
 *
 * @param itemPrice - Der Artikelpreis
 * @param platformFee - Die Plattform-Gebühr (5%, max CHF 150)
 * @param processingFeeOnly - Nur die Processing Fee (aus DB: order.protectionFee)
 */
export function calculateSellerAmount(
  itemPrice: number,
  platformFee: number,
  processingFeeOnly: number = 0
): number {
  // Berechne den Betrag vor Payout Fee
  const sellerAmountBeforePayout = itemPrice - platformFee - processingFeeOnly
  
  // Berechne Payout Fee (0.25% + CHF 0.55)
  const payoutFee = sellerAmountBeforePayout * STRIPE_FEE.payoutPercentage + STRIPE_FEE.payoutFixed
  
  // Verkäufer erhält: Artikelpreis - Kommission - Processing Fee - Payout Fee
  return Math.round((sellerAmountBeforePayout - payoutFee) * 100) / 100
}

/**
 * Berechnet die kombinierte Zahlungsgebühr für die Anzeige in der UI
 * 
 * @param itemPrice - Der Artikelpreis
 * @param platformFee - Die Plattform-Gebühr (5%, max CHF 150)
 * @param processingFeeOnly - Nur die Processing Fee (aus DB: order.protectionFee)
 */
export function calculateCombinedFeeForDisplay(
  itemPrice: number,
  platformFee: number,
  processingFeeOnly: number = 0
): number {
  // Berechne den Betrag vor Payout Fee
  const sellerAmountBeforePayout = itemPrice - platformFee - processingFeeOnly
  
  // Berechne Payout Fee (0.25% + CHF 0.55)
  const payoutFee = sellerAmountBeforePayout * STRIPE_FEE.payoutPercentage + STRIPE_FEE.payoutFixed
  
  // Kombinierte Gebühr = Processing Fee + Payout Fee
  return Math.round((processingFeeOnly + payoutFee) * 100) / 100
}
