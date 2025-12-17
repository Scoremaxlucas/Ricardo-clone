/**
 * Product Card Utilities
 * Formatting and helper functions for product listings
 */

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
  createdAt?: string | Date
  condition?: string
  shippingMethods?: string[]
  images?: string[] | string
}

/**
 * Format CHF amount with Swiss locale
 * Output: CHF 2.– or CHF 2.80 (always 2 decimals if not .00)
 * Critical: No CHF 1.8 - always CHF 1.80
 */
export function formatCHF(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'CHF 0.–'

  // Check if amount is whole number (.00)
  const isWholeNumber = amount % 1 === 0

  if (isWholeNumber) {
    // Whole number: CHF 2.–
    const formatted = amount.toLocaleString('de-CH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return `CHF ${formatted}.–`
  } else {
    // Has decimals: Always show 2 decimals (CHF 1.80, not CHF 1.8)
    const formatted = amount.toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `CHF ${formatted}`
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
 * Rules:
 * - Default: max 1 badge
 * - Exception: max 2 badges only if one is "Zahlungsschutz" (trust) and the other is a status badge
 * - Never show "Neu eingestellt" and "Neu" together
 * Priority: Payment Protection > New Listing > Condition
 */
export function getListingBadges(listing: ListingData): string[] {
  const badges: string[] = []
  let hasNewListing = false

  // Priority 1: Payment Protection (trust badge)
  if (listing.paymentProtectionEnabled) {
    badges.push('Zahlungsschutz')
  }

  // Priority 2: New Listing (< 48h)
  if (listing.createdAt) {
    try {
      const created = typeof listing.createdAt === 'string' ? new Date(listing.createdAt) : listing.createdAt
      const now = new Date()
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < 48) {
        badges.push('Neu eingestellt')
        hasNewListing = true
      }
    } catch {
      // Ignore date parsing errors
    }
  }

  // Priority 3: Condition (only if we have space and condition is meaningful)
  // CRITICAL: Never show condition "Neu" if "Neu eingestellt" is already shown
  if (listing.condition) {
    const conditionMap: Record<string, string> = {
      'new': 'Neu',
      'like-new': 'Wie neu',
      'very-good': 'Sehr gut',
      'good': 'Gut',
      'acceptable': 'Akzeptabel',
    }

    const conditionLabel = conditionMap[listing.condition.toLowerCase()] || listing.condition

    // Only add condition if:
    // 1. We have space (max 1 badge normally, max 2 if Zahlungsschutz exists)
    // 2. Condition label is meaningful (mapped, not raw slug)
    // 3. NOT "Neu" if "Neu eingestellt" is already shown
    const canAddCondition =
      (badges.length === 0 || (badges.length === 1 && badges[0] === 'Zahlungsschutz')) &&
      conditionLabel !== listing.condition &&
      !(hasNewListing && conditionLabel === 'Neu')

    if (canAddCondition) {
      badges.push(conditionLabel)
    }
  }

  // Enforce max 2 badges (only if Zahlungsschutz + status badge)
  if (badges.length > 2) {
    return badges.slice(0, 2)
  }

  // If we have 2 badges and first is not Zahlungsschutz, only keep first
  if (badges.length === 2 && badges[0] !== 'Zahlungsschutz') {
    return [badges[0]]
  }

  return badges
}

/**
 * Get delivery label
 * Returns: "Versand" | "Abholung" | "Versand/Abholung"
 */
export function getDeliveryLabel(listing: ListingData): string {
  if (!listing.shippingMethods || listing.shippingMethods.length === 0) {
    return 'Abholung' // Default fallback
  }

  const hasPickup = listing.shippingMethods.includes('pickup')
  const hasShipping = listing.shippingMethods.some(m => m !== 'pickup')

  if (hasPickup && hasShipping) {
    return 'Versand/Abholung'
  } else if (hasShipping) {
    return 'Versand'
  } else {
    return 'Abholung'
  }
}

/**
 * Get category display name from slug
 * Maps slug to user-friendly name
 */
export function getCategoryDisplayName(slug: string): string {
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

