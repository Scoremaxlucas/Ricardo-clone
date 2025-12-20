// Draft storage utility for listing wizard
// Excludes images to prevent localStorage overflow

export interface ListingDraftFormData {
  brand: string
  model: string
  referenceNumber: string
  year: string
  condition: string
  material: string
  movement: string
  caseDiameter: string
  price: string
  buyNowPrice: string
  isAuction: boolean
  auctionEnd: string
  auctionStart: string
  auctionDuration: string
  autoRenew: boolean
  shippingMethods: string[]
  lastRevision: string
  accuracy: string
  fullset: boolean
  onlyBox: boolean
  onlyPapers: boolean
  onlyAllLinks: boolean
  hasWarranty: boolean
  warrantyMonths: string
  warrantyYears: string
  hasSellerWarranty: boolean
  sellerWarrantyMonths: string
  sellerWarrantyYears: string
  sellerWarrantyNote: string
  title: string
  description: string
  images?: string[] // Optional - excluded from save
}

export interface ListingDraft {
  formData: ListingDraftFormData
  imageMetadata: {
    count: number
    titleImageIndex: number
  }
  selectedCategory: string
  selectedSubcategory: string
  selectedBooster: string
  paymentProtectionEnabled: boolean
  currentStep: number
  timestamp: number
}

const DRAFT_KEY_PREFIX = 'helvenda:sellDraft:'
const LEGACY_DRAFT_KEY = 'helvenda_listing_draft'
const MAX_DRAFT_AGE_DAYS = 7

/**
 * Get userId-scoped draft key
 */
function getDraftKey(userId: string | null | undefined): string | null {
  if (!userId) return null
  return `${DRAFT_KEY_PREFIX}${userId}`
}

/**
 * Migrate legacy global draft to userId-scoped key (one-time migration)
 */
function migrateLegacyDraft(userId: string | null | undefined): void {
  if (!userId || typeof window === 'undefined') return

  try {
    const legacyDraft = localStorage.getItem(LEGACY_DRAFT_KEY)
    if (!legacyDraft) return

    const userKey = getDraftKey(userId)
    if (!userKey) return

    // Check if user already has a draft
    if (localStorage.getItem(userKey)) {
      // User already has a draft, remove legacy
      localStorage.removeItem(LEGACY_DRAFT_KEY)
      return
    }

    // Migrate legacy draft to user-scoped key
    localStorage.setItem(userKey, legacyDraft)
    localStorage.removeItem(LEGACY_DRAFT_KEY)
    console.log('[Draft] Migrated legacy draft to user-scoped key')
  } catch (error) {
    console.error('[Draft] Error migrating legacy draft:', error)
  }
}

/**
 * Clear all draft keys for other users (call on auth change)
 */
export function clearOtherUserDrafts(currentUserId: string | null | undefined): void {
  if (typeof window === 'undefined' || !currentUserId) return

  try {
    const currentKey = getDraftKey(currentUserId)
    const keysToRemove: string[] = []

    // Find all draft keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DRAFT_KEY_PREFIX) && key !== currentKey) {
        keysToRemove.push(key)
      }
    }

    // Remove legacy key if exists
    if (localStorage.getItem(LEGACY_DRAFT_KEY)) {
      keysToRemove.push(LEGACY_DRAFT_KEY)
    }

    // Remove all non-current keys
    keysToRemove.forEach(key => localStorage.removeItem(key))

    if (keysToRemove.length > 0) {
      console.log(`[Draft] Cleared ${keysToRemove.length} draft keys for other users`)
    }
  } catch (error) {
    console.error('[Draft] Error clearing other user drafts:', error)
  }
}

export function saveDraft(draft: Omit<ListingDraft, 'timestamp'>, userId?: string | null): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Migrate legacy draft if needed
    if (userId) {
      migrateLegacyDraft(userId)
    }

    const draftKey = getDraftKey(userId)
    if (!draftKey) {
      console.warn('[Draft] Cannot save draft: userId required')
      return false
    }

    const draftWithTimestamp: ListingDraft = {
      ...draft,
      timestamp: Date.now(),
    }

    const draftJson = JSON.stringify(draftWithTimestamp)
    localStorage.setItem(draftKey, draftJson)
    return true
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn('[Draft] localStorage quota exceeded, skipping save')
    } else {
      console.error('[Draft] Error saving draft:', error)
    }
    return false
  }
}

export function loadDraft(userId?: string | null): ListingDraft | null {
  if (typeof window === 'undefined') return null

  try {
    // Migrate legacy draft if needed
    if (userId) {
      migrateLegacyDraft(userId)
    }

    const draftKey = getDraftKey(userId)
    if (!draftKey) return null

    const draftJson = localStorage.getItem(draftKey)
    if (!draftJson) return null

    const draft: ListingDraft = JSON.parse(draftJson)
    const draftAge = Date.now() - draft.timestamp
    const maxAge = MAX_DRAFT_AGE_DAYS * 24 * 60 * 60 * 1000

    if (draftAge > maxAge) {
      // Draft too old, remove it
      clearDraft(userId)
      return null
    }

    return draft
  } catch (error) {
    console.error('[Draft] Error loading draft:', error)
    clearDraft(userId) // Clear corrupted draft
    return null
  }
}

export function clearDraft(userId?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    const draftKey = getDraftKey(userId)
    if (draftKey) {
      localStorage.removeItem(draftKey)
    }
    // Also clear legacy key if exists
    localStorage.removeItem(LEGACY_DRAFT_KEY)
  } catch (error) {
    console.error('[Draft] Error clearing draft:', error)
  }
}

export function getDraftAge(userId?: string | null): number | null {
  if (typeof window === 'undefined') return null

  try {
    const draftKey = getDraftKey(userId)
    if (!draftKey) return null

    const draftJson = localStorage.getItem(draftKey)
    if (!draftJson) return null

    const draft: ListingDraft = JSON.parse(draftJson)
    return Date.now() - draft.timestamp
  } catch {
    return null
  }
}

export function getDraftAgeDays(userId?: string | null): number | null {
  const age = getDraftAge(userId)
  if (age === null) return null
  return age / (1000 * 60 * 60 * 24)
}
