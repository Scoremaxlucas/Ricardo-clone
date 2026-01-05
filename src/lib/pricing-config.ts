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
 * HELVENDA-MODELL (günstiger als Ricardo):
 * - Käufer zahlt NUR Artikelpreis + Versand
 * - Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr für Käufer)
 * - Verkäufer zahlt 5% Kommission + Zahlungsgebühr (Stripe Fee)
 * - Deckelung bei CHF 150 (Ricardo: CHF 290)
 *
 * Vergleich mit Ricardo:
 * - Ricardo: 8-12%, max CHF 290
 * - Helvenda: 5%, max CHF 150 (ca. 50% günstiger!)
 */
export const DEFAULT_PRICING = {
  platformFeeRate: 0.05, // 5% - wird vom VERKÄUFER bezahlt (Ricardo: 8-12%)
  protectionFeeRate: 0, // 0% - Zahlungsschutz ist INKLUSIVE (keine Gebühr für Käufer!)
  vatRate: 0.081, // 8.1%
  minimumCommission: 0.1, // CHF 0.10 Minimum (wie Ricardo)
  maximumCommission: 150, // CHF 150.- Maximum (Ricardo: CHF 290 - wir sind 48% günstiger!)
}

/**
 * Stripe Gebühren (Schweiz)
 *
 * VEREINFACHT: Beide Stripe-Gebühren werden zu einer "Zahlungsgebühr" kombiniert
 * - Payment Processing: 2.9% + CHF 0.30 (beim Zahlen)
 * - Payout: 0.25% + CHF 0.55 (bei Auszahlung an Verkäufer)
 *
 * Statt zwei separate Gebühren zeigen wir dem Verkäufer EINE kombinierte Gebühr.
 */
export const STRIPE_FEE = {
  // Payment Processing Fee (beim Zahlen durch Käufer)
  processingPercentage: 0.029, // 2.9%
  processingFixed: 0.3, // CHF 0.30

  // Payout Fee (bei Auszahlung an Verkäufer)
  payoutPercentage: 0.0025, // 0.25%
  payoutFixed: 0.55, // CHF 0.55
}

/**
 * Berechnet nur die Stripe Processing Fee (ohne Payout)
 * @deprecated Verwende calculateCombinedStripeFee() für die vollständige Gebühr
 */
export function calculateStripeFee(amount: number): number {
  return (
    Math.round((amount * STRIPE_FEE.processingPercentage + STRIPE_FEE.processingFixed) * 100) / 100
  )
}

/**
 * Berechnet die kombinierte Stripe-Gebühr (Processing + Payout)
 *
 * Diese Funktion berechnet beide Stripe-Gebühren und kombiniert sie zu einer
 * einzigen "Zahlungsgebühr", die dem Verkäufer angezeigt wird.
 *
 * Berechnung:
 * 1. Processing Fee: 2.9% + CHF 0.30 (auf den Gesamtbetrag, den der Käufer zahlt)
 * 2. Payout Fee: 0.25% + CHF 0.55 (auf den Betrag, der an den Verkäufer geht)
 *
 * @param buyerPaymentAmount - Der Gesamtbetrag, den der Käufer zahlt (inkl. Versand)
 * @param sellerItemPrice - Der Artikelpreis (ohne Versand), auf dem die Kommission basiert
 * @param platformFee - Die Plattform-Kommission (5%, max CHF 150)
 * @returns Die kombinierte Zahlungsgebühr
 */
export function calculateCombinedStripeFee(
  buyerPaymentAmount: number,
  sellerItemPrice: number,
  platformFee: number
): number {
  // 1. Processing Fee (auf den Gesamtbetrag, den der Käufer zahlt)
  const processingFee =
    buyerPaymentAmount * STRIPE_FEE.processingPercentage + STRIPE_FEE.processingFixed

  // 2. Berechne den Betrag, der an den Verkäufer geht (vor Payout Fee)
  // Verkäufer erhält: Artikelpreis - Kommission - Processing Fee
  const sellerAmountBeforePayoutFee = sellerItemPrice - platformFee - processingFee

  // 3. Payout Fee (auf den Betrag, der an den Verkäufer überwiesen wird)
  const payoutFee =
    sellerAmountBeforePayoutFee * STRIPE_FEE.payoutPercentage + STRIPE_FEE.payoutFixed

  // 4. Kombinierte Gebühr
  const combinedFee = processingFee + payoutFee

  return Math.round(combinedFee * 100) / 100
}
