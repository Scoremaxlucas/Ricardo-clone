/**
 * Zentrale Pricing-Konfiguration für Helvenda
 *
 * Diese Datei definiert die Standard-Gebühren für:
 * - Orders (Zahlungsschutz)
 * - Invoices (Kommission)
 * - Platform Fees
 *
 * Gebühren können über Environment Variables überschrieben werden.
 */

export interface PricingConfig {
  // Platform Fee (Kommission) - Standard 10%
  platformFeeRate: number

  // Zahlungsschutz-Gebühr - Standard 2%
  protectionFeeRate: number

  // MwSt Rate (für Invoices) - Standard 8.1%
  vatRate: number

  // Minimum/Maximum Kommission (optional)
  minimumCommission?: number
  maximumCommission?: number
}

/**
 * Lädt die Pricing-Konfiguration aus Environment Variables oder verwendet Defaults
 */
export function getPricingConfig(): PricingConfig {
  const platformFeeRate = parseFloat(
    process.env.PLATFORM_FEE_RATE || '0.1'
  ) // Default: 10%

  const protectionFeeRate = parseFloat(
    process.env.PROTECTION_FEE_RATE || '0.02'
  ) // Default: 2%

  const vatRate = parseFloat(
    process.env.VAT_RATE || '0.081'
  ) // Default: 8.1%

  const minimumCommission = process.env.MINIMUM_COMMISSION
    ? parseFloat(process.env.MINIMUM_COMMISSION)
    : undefined

  const maximumCommission = process.env.MAXIMUM_COMMISSION
    ? parseFloat(process.env.MAXIMUM_COMMISSION)
    : undefined

  return {
    platformFeeRate,
    protectionFeeRate,
    vatRate,
    minimumCommission,
    maximumCommission,
  }
}

/**
 * Berechnet die Plattform-Gebühr mit optionalen Min/Max Limits
 */
export function calculatePlatformFee(
  itemPrice: number,
  config?: Partial<PricingConfig>
): number {
  const pricingConfig = config ? { ...getPricingConfig(), ...config } : getPricingConfig()

  let fee = itemPrice * pricingConfig.platformFeeRate

  // Wende Minimum an, falls definiert
  if (pricingConfig.minimumCommission !== undefined && fee < pricingConfig.minimumCommission) {
    fee = pricingConfig.minimumCommission
  }

  // Wende Maximum an, falls definiert
  if (pricingConfig.maximumCommission !== undefined && fee > pricingConfig.maximumCommission) {
    fee = pricingConfig.maximumCommission
  }

  return Math.round(fee * 100) / 100
}

/**
 * Berechnet die Zahlungsschutz-Gebühr
 */
export function calculateProtectionFee(
  itemPrice: number,
  config?: Partial<PricingConfig>
): number {
  const pricingConfig = config ? { ...getPricingConfig(), ...config } : getPricingConfig()
  return Math.round(itemPrice * pricingConfig.protectionFeeRate * 100) / 100
}

/**
 * Standard Pricing Config (für Backwards Compatibility)
 */
export const DEFAULT_PRICING = {
  platformFeeRate: 0.1, // 10%
  protectionFeeRate: 0.02, // 2%
  vatRate: 0.081, // 8.1%
  minimumCommission: 0,
  maximumCommission: 220, // CHF 220.- Maximum (wie im Admin Pricing)
}
