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
 * Output: CHF 2.– or CHF 2.00 (consistent across platform)
 */
export function formatCHF(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'CHF 0.–'
  
  // Use Swiss locale with thousands separator
  const formatted = amount.toLocaleString('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  
  // Variant A: CHF 2.– (recommended for marketplace)
  // If amount is whole number, show CHF 2.–, otherwise CHF 2.50
  if (amount % 1 === 0) {
    return `CHF ${formatted}.–`
  }
  return `CHF ${formatted}`
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
 * Get listing badges (max 2)
 * Priority: Payment Protection > New Listing > Condition
 */
export function getListingBadges(listing: ListingData): string[] {
  const badges: string[] = []
  
  // Priority 1: Payment Protection
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
      }
    } catch {
      // Ignore date parsing errors
    }
  }
  
  // Priority 3: Condition (only if we have space and condition is meaningful)
  if (badges.length < 2 && listing.condition) {
    const conditionMap: Record<string, string> = {
      'new': 'Neu',
      'like-new': 'Wie neu',
      'very-good': 'Sehr gut',
      'good': 'Gut',
      'acceptable': 'Akzeptabel',
    }
    
    const conditionLabel = conditionMap[listing.condition.toLowerCase()] || listing.condition
    if (conditionLabel && conditionLabel !== listing.condition) {
      badges.push(conditionLabel)
    }
  }
  
  return badges.slice(0, 2)
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

