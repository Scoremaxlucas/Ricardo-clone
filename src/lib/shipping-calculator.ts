import { prisma } from '@/lib/prisma'

export interface ShippingSelection {
  service: 'economy' | 'priority'
  weightTier: 2 | 10 | 30
  addons?: {
    sperrgut?: boolean
    pickhome?: boolean
  }
}

export interface ShippingCostResult {
  total: number
  breakdown: {
    base: number
    sperrgut: number
    pickhome: number
    freeShippingApplied: boolean
  }
  rateSetId: string
  shippingCode: string
}

// Fallback-Preise falls DB-Catalog leer ist (Schweizer Post Tarife 2024)
const FALLBACK_RATES: Record<string, number> = {
  post_economy_2kg: 9.0,
  post_economy_10kg: 12.0,
  post_economy_30kg: 21.0,
  post_priority_2kg: 13.5,
  post_priority_10kg: 15.0,
  post_priority_30kg: 24.0,
  addon_sperrgut: 13.0,
  addon_pickhome: 3.4,
}

/**
 * Berechnet Versandkosten basierend auf Selection und Catalog
 * Single Source of Truth für Preisberechnung
 */
export async function calculateShippingCost(
  selection: ShippingSelection,
  itemPrice: number,
  freeShippingThresholdChf: number | null = null,
  allowedAddons?: { sperrgut?: boolean; pickhome?: boolean }
): Promise<ShippingCostResult> {
  const rateSetId = 'default_ch_post'
  const baseCode = `post_${selection.service}_${selection.weightTier}kg`

  // Versuche Catalog aus DB zu laden
  let catalogEntries: Array<{ code: string; basePriceChf: number }> = []
  try {
    catalogEntries = await prisma.shippingRateCatalog.findMany({
      where: {
        rateSetId,
        isActive: true,
      },
      select: {
        code: true,
        basePriceChf: true,
      },
    })
  } catch (e) {
    console.warn('[shipping-calculator] DB lookup failed, using fallback rates')
  }

  // Finde Base Rate (DB oder Fallback)
  const baseRate = catalogEntries.find(r => r.code === baseCode)
  const basePrice = baseRate?.basePriceChf ?? FALLBACK_RATES[baseCode]

  if (basePrice === undefined) {
    throw new Error(`Base rate not found: ${baseCode}`)
  }

  const basePrice = baseRate.basePriceChf

  // Berechne Add-ons (mit Fallback)
  let sperrgutPrice = 0
  let pickhomePrice = 0

  // Sperrgut
  if (selection.addons?.sperrgut && allowedAddons?.sperrgut !== false) {
    const sperrgutRate = catalogEntries.find(r => r.code === 'addon_sperrgut')
    sperrgutPrice = sperrgutRate?.basePriceChf ?? FALLBACK_RATES['addon_sperrgut'] ?? 0
  }

  // Pick@home
  if (selection.addons?.pickhome && allowedAddons?.pickhome !== false) {
    const pickhomeRate = catalogEntries.find(r => r.code === 'addon_pickhome')
    pickhomePrice = pickhomeRate?.basePriceChf ?? FALLBACK_RATES['addon_pickhome'] ?? 0
  }

  // Berechne Total
  let total = basePrice + sperrgutPrice + pickhomePrice
  const freeShippingApplied =
    freeShippingThresholdChf !== null && itemPrice >= freeShippingThresholdChf

  if (freeShippingApplied) {
    total = 0
  }

  // Rundung auf 0.05 CHF (Schweizer Standard)
  total = Math.round(total * 20) / 20

  return {
    total,
    breakdown: {
      base: basePrice,
      sperrgut: sperrgutPrice,
      pickhome: pickhomePrice,
      freeShippingApplied,
    },
    rateSetId,
    shippingCode: baseCode,
  }
}

/**
 * Holt alle verfügbaren Shipping Rates für ein Rate-Set
 */
export async function getShippingRates(rateSetId: string = 'default_ch_post') {
  return prisma.shippingRateCatalog.findMany({
    where: {
      rateSetId,
      isActive: true,
      isAddon: false, // Nur Base-Rates
    },
    orderBy: [{ service: 'asc' }, { weightTier: 'asc' }],
  })
}

/**
 * Holt alle verfügbaren Add-ons
 */
export async function getShippingAddons(rateSetId: string = 'default_ch_post') {
  return prisma.shippingRateCatalog.findMany({
    where: {
      rateSetId,
      isActive: true,
      isAddon: true,
    },
  })
}

/**
 * Validiert eine Shipping Selection gegen erlaubte Optionen
 */
export function validateShippingSelection(
  selection: ShippingSelection,
  allowedAddons?: { sperrgut?: boolean; pickhome?: boolean }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!['economy', 'priority'].includes(selection.service)) {
    errors.push('Ungültiger Service')
  }

  if (![2, 10, 30].includes(selection.weightTier)) {
    errors.push('Ungültige Gewichtsklasse')
  }

  if (selection.addons?.sperrgut && allowedAddons?.sperrgut === false) {
    errors.push('Sperrgut ist nicht erlaubt')
  }

  if (selection.addons?.pickhome && allowedAddons?.pickhome === false) {
    errors.push('Pick@home ist nicht erlaubt')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
