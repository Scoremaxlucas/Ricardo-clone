/**
 * Product Card Utilities
 * Formatting and helper functions for product listings
 *
 * ============================================================================
 * CARD DATA REQUIREMENTS (Ricardo-Level)
 * ============================================================================
 *
 * Required fields for ProductCard:
 *   - id: string
 *   - title: string
 *   - price: number (base price for fixed, start price for auction)
 *   - images: string[] | string
 *   - isAuction: boolean
 *   - createdAt: string | Date
 *
 * Auction-specific:
 *   - auctionEnd: string | Date (required if isAuction)
 *   - currentBid: number (calculated from bids if not provided)
 *   - bids: array (for bid count)
 *
 * Shipping/Delivery:
 *   - shippingMethods: string[] (e.g., ['pickup', 'post_economy_2kg'])
 *   - shippingMinCost: number | null (min shipping cost in CHF)
 *   - pickupOnly: boolean (derived from shippingMethods)
 *
 * Trust indicators:
 *   - paymentProtectionEnabled: boolean
 *   - sellerVerified: boolean
 *
 * Boost/Promotion:
 *   - boosters: string[] (e.g., ['boost', 'turbo-boost', 'super-boost'])
 *   - isPromoted: boolean (derived from boosters.length > 0)
 *
 * Optional (feature flags):
 *   - favoritesCount: number (show if > 0)
 *   - viewsCount: number (show if > N)
 *
 * Location:
 *   - city: string
 *   - postalCode: string
 *
 * ============================================================================
 * BADGE RULES
 * ============================================================================
 * - Max 2 badges per card
 * - Priority: Zahlungsschutz > Gesponsert > Neu eingestellt > Zustand
 * - "Gesponsert" only if boosters.length > 0
 * - "Neu eingestellt" only if createdAt < 48 hours
 * - "Zustand" only if condition is meaningful and space allows
 * - Never show "Neu" (condition) if "Neu eingestellt" is shown
 *
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 * - SHOW_SOCIAL_PROOF: boolean (show favorites/views count)
 * - SOCIAL_PROOF_MIN_FAVORITES: number (min count to show, default: 3)
 * - SOCIAL_PROOF_MIN_VIEWS: number (min count to show, default: 50)
 *
 * ============================================================================
 */

// Feature flags (can be moved to env/config)
export const CARD_FEATURE_FLAGS = {
  SHOW_SOCIAL_PROOF: false, // Set to true to enable favorites/views display
  SOCIAL_PROOF_MIN_FAVORITES: 3,
  SOCIAL_PROOF_MIN_VIEWS: 50,
  NEW_LISTING_HOURS: 48, // Hours after creation to show "Neu eingestellt"
}

export interface ListingData {
  id: string
  title: string
  price: number
  buyNowPrice?: number
  currentBid?: number
  isAuction?: boolean
  auctionEnd?: string | Date
  bids?: any[]
  paymentProtectionEnabled?: boolean
  sellerVerified?: boolean
  createdAt?: string | Date
  condition?: string
  shippingMethods?: string[]
  shippingMinCost?: number | null
  boosters?: string[]
  images?: string[] | string
  favoritesCount?: number
  viewsCount?: number
}

/**
 * Format CHF amount with Swiss locale
 *
 * Swiss formatting rules:
 * - Thousand separator: apostrophe (')
 * - Decimal separator: period (.)
 * - Whole numbers: CHF 1'850.–
 * - With decimals: CHF 1'850.50 (always 2 decimals)
 *
 * Examples:
 *   formatCHF(1) => "CHF 1.–"
 *   formatCHF(1.5) => "CHF 1.50"
 *   formatCHF(1.80) => "CHF 1.80"
 *   formatCHF(1850) => "CHF 1'850.–"
 *   formatCHF(1850.50) => "CHF 1'850.50"
 *   formatCHF(0) => "CHF 0.–"
 */
export function formatCHF(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'CHF 0.–'

  // Check if amount is whole number (.00)
  const isWholeNumber = Math.abs(amount % 1) < 0.001

  // Format with Swiss locale (uses apostrophe as thousand separator)
  if (isWholeNumber) {
    // Whole number: Use apostrophe for thousands, end with .–
    const integerPart = Math.round(amount)
    const formatted = integerPart.toLocaleString('de-CH')
    return `CHF ${formatted}.–`
  } else {
    // Has decimals: Always show 2 decimals with apostrophe thousands
    const formatted = amount.toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `CHF ${formatted}`
  }
}

/**
 * Format CHF amount without currency prefix (just the number)
 * Useful for compact displays where "CHF" is shown separately
 */
export function formatCHFCompact(amount: number): string {
  if (isNaN(amount) || amount < 0) return '0.–'

  const isWholeNumber = Math.abs(amount % 1) < 0.001

  if (isWholeNumber) {
    const integerPart = Math.round(amount)
    return `${integerPart.toLocaleString('de-CH')}.–`
  } else {
    return amount.toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}

/**
 * Format time left for auction
 * Returns: "2h 14m", "3d 5h", "Beendet", or fallback
 */
export function formatTimeLeft(auctionEndsAt: string | Date | null | undefined): string {
  if (!auctionEndsAt) return ''

  try {
    const end = typeof auctionEndsAt === 'string' ? new Date(auctionEndsAt) : auctionEndsAt
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Beendet'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return '< 1m'
    }
  } catch {
    return ''
  }
}

/**
 * Get listing badges (strict rules)
 *
 * Rules:
 * - Max 2 badges per card
 * - Priority: Zahlungsschutz > Gesponsert > Neu eingestellt > Zustand
 * - "Gesponsert" only if boosters.length > 0
 * - "Neu eingestellt" only if createdAt < NEW_LISTING_HOURS
 * - Never show "Neu" (condition) if "Neu eingestellt" is shown
 *
 * Badge types:
 * - Trust: "Zahlungsschutz" (Shield icon)
 * - Promo: "Gesponsert" (Sparkles icon)
 * - New: "Neu eingestellt"
 * - Condition: "Wie neu", "Sehr gut", etc.
 */
export function getListingBadges(listing: ListingData): string[] {
  const badges: string[] = []
  let hasNewListing = false

  // Priority 1: Payment Protection (trust badge)
  if (listing.paymentProtectionEnabled) {
    badges.push('Zahlungsschutz')
  }

  // Priority 2: Sponsored/Boosted
  const boosters = listing.boosters || []
  const isPromoted = boosters.length > 0
  if (isPromoted && badges.length < 2) {
    badges.push('Gesponsert')
  }

  // Priority 3: New Listing (< configurable hours, default 48h)
  if (listing.createdAt && badges.length < 2) {
    try {
      const created =
        typeof listing.createdAt === 'string' ? new Date(listing.createdAt) : listing.createdAt
      const now = new Date()
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < CARD_FEATURE_FLAGS.NEW_LISTING_HOURS) {
        badges.push('Neu eingestellt')
        hasNewListing = true
      }
    } catch {
      // Ignore date parsing errors
    }
  }

  // Priority 4: Condition (only if we have space and condition is meaningful)
  // CRITICAL: Never show condition "Neu" if "Neu eingestellt" is already shown
  if (listing.condition && badges.length < 2) {
    const conditionMap: Record<string, string> = {
      new: 'Neu',
      'like-new': 'Wie neu',
      'very-good': 'Sehr gut',
      good: 'Gut',
      acceptable: 'Akzeptabel',
      // German variants
      neu: 'Neu',
      'wie neu': 'Wie neu',
      'sehr gut': 'Sehr gut',
      gut: 'Gut',
      akzeptabel: 'Akzeptabel',
    }

    const conditionLower = listing.condition.toLowerCase()
    const conditionLabel = conditionMap[conditionLower] || listing.condition

    // Only add if:
    // 1. We have space (< 2 badges)
    // 2. NOT "Neu" if "Neu eingestellt" is already shown
    const canAddCondition = !(hasNewListing && conditionLabel === 'Neu')

    if (canAddCondition) {
      badges.push(conditionLabel)
    }
  }

  // Enforce max 2 badges
  return badges.slice(0, 2)
}

/**
 * Check if listing is promoted/boosted
 */
export function isListingPromoted(listing: ListingData): boolean {
  const boosters = listing.boosters || []
  return boosters.length > 0
}

/**
 * Get boost type for styling (super > turbo > standard)
 */
export function getBoostType(
  listing: ListingData
): 'super-boost' | 'turbo-boost' | 'boost' | null {
  const boosters = listing.boosters || []
  if (boosters.includes('super-boost')) return 'super-boost'
  if (boosters.includes('turbo-boost')) return 'turbo-boost'
  if (boosters.includes('boost')) return 'boost'
  return null
}

/**
 * Get delivery label with optional cost
 *
 * Returns object with:
 * - label: "Versand" | "Abholung" | "Versand/Abholung"
 * - costLabel: "ab CHF X" | "Gratis" | null
 * - pickupOnly: boolean
 * - shippingAvailable: boolean
 *
 * Examples:
 *   - { label: "Nur Abholung", pickupOnly: true, shippingAvailable: false }
 *   - { label: "Versand ab CHF 7.–", costLabel: "ab CHF 7.–", pickupOnly: false }
 *   - { label: "Gratis Versand", costLabel: "Gratis", pickupOnly: false }
 */
export interface DeliveryInfo {
  label: string
  costLabel: string | null
  pickupOnly: boolean
  shippingAvailable: boolean
  pickupAvailable: boolean
}

export function getDeliveryInfo(listing: ListingData): DeliveryInfo {
  const methods = listing.shippingMethods || []
  const hasPickup = methods.includes('pickup')
  const hasShipping = methods.some(m => m !== 'pickup')
  const shippingMinCost = listing.shippingMinCost

  // Default fallback
  if (methods.length === 0) {
    return {
      label: 'Abholung',
      costLabel: null,
      pickupOnly: true,
      shippingAvailable: false,
      pickupAvailable: true,
    }
  }

  // Pickup only
  if (hasPickup && !hasShipping) {
    return {
      label: 'Nur Abholung',
      costLabel: null,
      pickupOnly: true,
      shippingAvailable: false,
      pickupAvailable: true,
    }
  }

  // Shipping available
  let costLabel: string | null = null
  let label = 'Versand'

  if (shippingMinCost !== undefined && shippingMinCost !== null) {
    if (shippingMinCost === 0) {
      costLabel = 'Gratis'
      label = 'Gratis Versand'
    } else {
      costLabel = `ab ${formatCHF(shippingMinCost)}`
      label = `Versand ${costLabel}`
    }
  }

  if (hasPickup && hasShipping) {
    return {
      label: hasShipping ? label : 'Versand/Abholung',
      costLabel,
      pickupOnly: false,
      shippingAvailable: true,
      pickupAvailable: true,
    }
  }

  return {
    label,
    costLabel,
    pickupOnly: false,
    shippingAvailable: true,
    pickupAvailable: false,
  }
}

/**
 * Simple delivery label (backward compatible)
 * Returns: "Versand" | "Abholung" | "Versand/Abholung"
 */
export function getDeliveryLabel(listing: ListingData): string {
  const info = getDeliveryInfo(listing)
  // Return simplified label for backward compatibility
  if (info.pickupOnly) return 'Abholung'
  if (info.pickupAvailable && info.shippingAvailable) return 'Versand/Abholung'
  if (info.shippingAvailable) return 'Versand'
  return 'Abholung'
}

/**
 * Get category display name from slug
 * Maps slug to user-friendly name
 * Uses categoryConfig from @/data/categories for consistency
 */
export function getCategoryDisplayName(slug: string): string {
  // Import dynamically to avoid circular dependencies
  try {
    const { getCategoryConfig } = require('@/data/categories')
    const config = getCategoryConfig(slug)
    return config.name || slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch {
    // Fallback if import fails
    const categoryMap: Record<string, string> = {
      'sport-freizeit': 'Sport & Freizeit',
      'auto-motorrad': 'Auto & Motorrad',
      'computer-netzwerk': 'Computer & Netzwerk',
      'uhren-schmuck': 'Uhren & Schmuck',
      'kleidung-accessoires': 'Kleidung & Accessoires',
      'haushalt-wohnen': 'Haushalt & Wohnen',
      'elektronik': 'Elektronik',
      'musik-instrumente': 'Musik & Instrumente',
      'buecher-filme': 'Bücher & Filme',
      'spielzeug-hobby': 'Spielzeug & Hobby',
      'tierbedarf': 'Tierbedarf',
      'garten': 'Garten',
    }
    return categoryMap[slug] || slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

/**
 * Get subcategory display name from slug
 * Returns formatted label or slug if no mapping exists
 */
export function getSubcategoryDisplayName(subcategory: string): string {
  if (!subcategory) return ''
  // Capitalize first letter and replace dashes with spaces
  return subcategory
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

