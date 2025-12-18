/**
 * EditPolicy - Ricardo-like editing restrictions for published listings
 *
 * Defines what can be edited based on listing state:
 * - DRAFT: Full editing
 * - PUBLISHED/ACTIVE: Some fields locked (category, sale type)
 * - AUCTION with bids: Append-only (addendum + images only)
 * - BUYER COMMITMENT: Read-only
 */

export type EditPolicyLevel = 'FULL' | 'PUBLISHED_LIMITED' | 'LIMITED_APPEND_ONLY' | 'READ_ONLY'

export interface EditPolicy {
  level: EditPolicyLevel
  allowedFields: string[]
  lockedSteps: number[] // Step indices (0-based) that are readonly/disabled
  uiLocks: {
    category: boolean
    subcategory: boolean
    saleType: boolean // auction vs fixed
    title: boolean
    description: boolean
    descriptionAppendOnly: boolean // If true, show addendum input instead
    images: boolean
    imagesAppendOnly: boolean // If true, only allow adding, not deleting/reordering
    price: boolean
    buyNowPrice: boolean
    auctionStart: boolean
    auctionEnd: boolean
    auctionDuration: boolean
    shipping: boolean
    boosters: boolean
  }
  reason: string // German message for UI banners
}

export interface ListingState {
  // Listing status
  isPublished: boolean // Has moderationStatus === 'approved' or similar
  isDraft: boolean // Not published yet

  // Sale type
  isAuction: boolean
  isFixedPrice: boolean

  // Bids
  bidsCount: number

  // Buyer commitment
  hasActivePurchase: boolean
  hasActiveSale: boolean
  purchaseStatus?: string // 'pending', 'in_checkout', 'paid', 'sold', 'completed', 'dispute', etc.

  // Other
  moderationStatus?: string
}

/**
 * Compute edit policy based on listing state
 */
export function getEditPolicy(state: ListingState): EditPolicy {
  // E) ANY STATE WITH BUYER COMMITMENT → READ_ONLY
  if (state.hasActivePurchase || state.hasActiveSale) {
    const status = state.purchaseStatus || 'unknown'
    return {
      level: 'READ_ONLY',
      allowedFields: [],
      lockedSteps: [0, 1, 2, 3, 4, 5], // All steps locked
      uiLocks: {
        category: true,
        subcategory: true,
        saleType: true,
        title: true,
        description: true,
        descriptionAppendOnly: false,
        images: true,
        imagesAppendOnly: false,
        price: true,
        buyNowPrice: true,
        auctionStart: true,
        auctionEnd: true,
        auctionDuration: true,
        shipping: true,
        boosters: true,
      },
      reason:
        'Dieses Angebot kann nicht mehr bearbeitet werden, da bereits eine verbindliche Transaktion/Status besteht.',
    }
  }

  // A) DRAFT (not published yet) → FULL
  if (state.isDraft || !state.isPublished) {
    return {
      level: 'FULL',
      allowedFields: ['*'], // All fields allowed
      lockedSteps: [],
      uiLocks: {
        category: false,
        subcategory: false,
        saleType: false,
        title: false,
        description: false,
        descriptionAppendOnly: false,
        images: false,
        imagesAppendOnly: false,
        price: false,
        buyNowPrice: false,
        auctionStart: false,
        auctionEnd: false,
        auctionDuration: false,
        shipping: false,
        boosters: false,
      },
      reason: '',
    }
  }

  // From here: PUBLISHED/ACTIVE

  // D) ACTIVE + AUCTION with bids >= 1 → LIMITED_APPEND_ONLY
  if (state.isAuction && state.bidsCount >= 1) {
    return {
      level: 'LIMITED_APPEND_ONLY',
      allowedFields: ['descriptionAddendum', 'newImages'], // Special field names for append-only
      lockedSteps: [0, 3, 4, 5], // Category, Price, Shipping, Review locked
      uiLocks: {
        category: true,
        subcategory: true,
        saleType: true,
        title: true,
        description: true, // Existing description locked
        descriptionAppendOnly: true, // Show addendum input
        images: false, // Can add images
        imagesAppendOnly: true, // But cannot delete/reorder
        price: true,
        buyNowPrice: true,
        auctionStart: true,
        auctionEnd: true,
        auctionDuration: true,
        shipping: true,
        boosters: true,
      },
      reason:
        'Dieses Angebot hat bereits Gebote. Änderungen sind nicht mehr möglich – nur Ergänzungen im Text und zusätzliche Bilder.',
    }
  }

  // C) ACTIVE + FIXED PRICE (no buyer commitment) → PUBLISHED_LIMITED
  if (state.isFixedPrice) {
    return {
      level: 'PUBLISHED_LIMITED',
      allowedFields: [
        'title',
        'description',
        'images',
        'price',
        'shippingMethods',
        'shippingMethod', // Alternative field name
        'boosters',
        // Category and sale type are locked (post-publish locks)
      ],
      lockedSteps: [0], // Category step locked
      uiLocks: {
        category: true,
        subcategory: true,
        saleType: true,
        title: false, // Allow title edits
        description: false,
        descriptionAppendOnly: false,
        images: false,
        imagesAppendOnly: false,
        price: false,
        buyNowPrice: false,
        auctionStart: true, // Not applicable
        auctionEnd: true, // Not applicable
        auctionDuration: true, // Not applicable
        shipping: false,
        boosters: false,
      },
      reason:
        'Dieses Angebot ist veröffentlicht. Einige Angaben (z.B. Kategorie/Verkaufsart) können nicht mehr geändert werden.',
    }
  }

  // B) ACTIVE + AUCTION with bids = 0 → PUBLISHED_LIMITED (Ricardo: Full editing allowed before any bid)
  // Ricardo rule: "Before Any Bid Is Placed - Listings can be fully edited by the seller"
  // We allow full editing except category/sale type (post-publish locks)
  if (state.isAuction && state.bidsCount === 0) {
    return {
      level: 'PUBLISHED_LIMITED',
      allowedFields: [
        'title',
        'description',
        'images',
        'price', // Starting price editable before bids
        'buyNowPrice', // Buy-now price editable before bids
        'auctionStart', // Auction start editable before bids
        'auctionEnd', // Auction end editable before bids
        'auctionDuration', // Duration editable before bids
        'shippingMethods',
        'shippingMethod', // Alternative field name
        'boosters',
        // Category and sale type are locked (post-publish locks)
      ],
      lockedSteps: [0], // Only category step locked (post-publish lock)
      uiLocks: {
        category: true,
        subcategory: true,
        saleType: true,
        title: false,
        description: false,
        descriptionAppendOnly: false,
        images: false,
        imagesAppendOnly: false,
        price: false, // Starting price editable before bids (Ricardo rule)
        buyNowPrice: false, // Buy-now price editable before bids
        auctionStart: false, // Auction start editable before bids
        auctionEnd: false, // Auction end editable before bids
        auctionDuration: false, // Duration editable before bids
        shipping: false,
        boosters: false,
      },
      reason:
        'Dieses Angebot ist veröffentlicht. Einige Angaben (z.B. Kategorie/Verkaufsart) können nicht mehr geändert werden.',
    }
  }

  // Fallback: PUBLISHED_LIMITED (shouldn't reach here, but safe default)
  return {
    level: 'PUBLISHED_LIMITED',
    allowedFields: ['title', 'description', 'images'],
    lockedSteps: [0],
    uiLocks: {
      category: true,
      subcategory: true,
      saleType: true,
      title: false,
      description: false,
      descriptionAppendOnly: false,
      images: false,
      imagesAppendOnly: false,
      price: true,
      buyNowPrice: true,
      auctionStart: true,
      auctionEnd: true,
      auctionDuration: true,
      shipping: true,
      boosters: true,
    },
    reason: 'Dieses Angebot ist veröffentlicht. Einige Angaben können nicht mehr geändert werden.',
  }
}

/**
 * Check if a field can be edited
 */
export function canEditField(policy: EditPolicy, fieldName: string): boolean {
  if (policy.level === 'FULL') return true
  if (policy.level === 'READ_ONLY') return false
  if (policy.allowedFields.includes('*')) return true
  return policy.allowedFields.includes(fieldName)
}

/**
 * Check if a step is locked
 */
export function isStepLocked(policy: EditPolicy, stepIndex: number): boolean {
  return policy.lockedSteps.includes(stepIndex)
}
