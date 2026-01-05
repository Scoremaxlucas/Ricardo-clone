/**
 * Zentrale Pricing-Konfiguration für Helvenda
 *
 * WICHTIG: RICARDO-MODELL
 * ======================
 * Der Käufer zahlt NUR den Artikelpreis + Versandkosten.
 * Der Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr für den Käufer).
 * Die Plattform-Gebühr wird vom Verkäufer bezahlt (bei der Auszahlung abgezogen).
 *
 * Diese Datei definiert die Standard-Gebühren für:
 * - Orders (Zahlungsschutz) - Käufer zahlt KEINE zusätzliche Gebühr
 * - Invoices (Kommission) - Verkäufer zahlt 10% Kommission
 * - Platform Fees - Wird bei Auszahlung vom Verkäufer-Betrag abgezogen
 *
 * Gebühren werden aus der Datenbank geladen (Admin-Pricing-Settings).
 * Falls keine Datenbank-Einstellungen vorhanden sind, werden Environment Variables verwendet.
 * Als letzter Fallback werden die Default-Werte verwendet.
 */

export interface PricingConfig {
  // Platform Fee (Kommission) - Standard 10%
  // HINWEIS: Wird vom VERKÄUFER bezahlt, nicht vom Käufer!
  platformFeeRate: number

  // Zahlungsschutz-Gebühr - IMMER 0 (Zahlungsschutz ist inklusive!)
  // DEPRECATED: Diese Gebühr wird nicht mehr vom Käufer erhoben
  protectionFeeRate: number

  // MwSt Rate (für Invoices) - Standard 8.1%
  vatRate: number

  // Minimum/Maximum Kommission (optional)
  minimumCommission?: number
  maximumCommission?: number
}

/**
 * Lädt die Pricing-Konfiguration aus der Datenbank (Admin-Pricing-Settings)
 * Falls keine DB-Einstellungen vorhanden sind, werden Environment Variables verwendet.
 * Als letzter Fallback werden die Default-Werte verwendet.
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    // Versuche aus Datenbank zu laden
    const { prisma } = await import('./prisma')
    const latestPricing = await prisma.pricingHistory.findFirst({
      orderBy: { changedAt: 'desc' },
      select: {
        platformMarginRate: true,
        protectionFeeRate: true,
        vatRate: true,
        minimumCommission: true,
        maximumCommission: true,
      },
    })

    if (latestPricing) {
      return {
        platformFeeRate: latestPricing.platformMarginRate ?? DEFAULT_PRICING.platformFeeRate,
        protectionFeeRate: latestPricing.protectionFeeRate ?? DEFAULT_PRICING.protectionFeeRate,
        vatRate: latestPricing.vatRate ?? DEFAULT_PRICING.vatRate,
        minimumCommission: latestPricing.minimumCommission ?? DEFAULT_PRICING.minimumCommission,
        maximumCommission: latestPricing.maximumCommission ?? DEFAULT_PRICING.maximumCommission,
      }
    }
  } catch (error) {
    // Bei Fehler (z.B. DB nicht verfügbar), verwende Fallback
    console.warn('[pricing-config] Fehler beim Laden aus DB, verwende Fallback:', error)
  }

  // Fallback: Environment Variables oder Defaults
  const platformFeeRate = parseFloat(
    process.env.PLATFORM_FEE_RATE || String(DEFAULT_PRICING.platformFeeRate)
  )

  const protectionFeeRate = parseFloat(
    process.env.PROTECTION_FEE_RATE || String(DEFAULT_PRICING.protectionFeeRate)
  )

  const vatRate = parseFloat(process.env.VAT_RATE || String(DEFAULT_PRICING.vatRate))

  const minimumCommission = process.env.MINIMUM_COMMISSION
    ? parseFloat(process.env.MINIMUM_COMMISSION)
    : DEFAULT_PRICING.minimumCommission

  const maximumCommission = process.env.MAXIMUM_COMMISSION
    ? parseFloat(process.env.MAXIMUM_COMMISSION)
    : DEFAULT_PRICING.maximumCommission

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
export async function calculatePlatformFee(
  itemPrice: number,
  config?: Partial<PricingConfig>
): Promise<number> {
  const pricingConfig = config
    ? { ...(await getPricingConfig()), ...config }
    : await getPricingConfig()

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
 *
 * DEPRECATED: Diese Funktion gibt immer 0 zurück.
 * Im Ricardo-Modell ist der Zahlungsschutz INKLUSIVE (keine zusätzliche Gebühr für den Käufer).
 *
 * @deprecated Zahlungsschutz ist jetzt inklusive - diese Funktion gibt immer 0 zurück
 */
export async function calculateProtectionFee(
  _itemPrice: number,
  _config?: Partial<PricingConfig>
): Promise<number> {
  // RICARDO-MODELL: Zahlungsschutz ist INKLUSIVE - keine Gebühr für Käufer
  return 0
}

/**
 * Standard Pricing Config
 *
 * RICARDO-MODELL: Käufer zahlt NUR Artikelpreis + Versand
 * - protectionFeeRate ist 0 (Zahlungsschutz ist inklusive)
 * - platformFeeRate wird vom VERKÄUFER bezahlt (bei Auszahlung abgezogen)
 */
export const DEFAULT_PRICING = {
  platformFeeRate: 0.1, // 10% - wird vom VERKÄUFER bezahlt
  protectionFeeRate: 0, // 0% - Zahlungsschutz ist INKLUSIVE (keine Gebühr für Käufer!)
  vatRate: 0.081, // 8.1%
  minimumCommission: 0,
  maximumCommission: 220, // CHF 220.- Maximum (wie im Admin Pricing)
}
