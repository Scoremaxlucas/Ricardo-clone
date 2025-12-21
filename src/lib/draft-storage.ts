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

/**
 * Save draft to DB via API (primary method)
 * Falls back to localStorage if API fails
 */
export async function saveDraft(
  draft: Omit<ListingDraft, 'timestamp'>,
  userId?: string | null
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (!userId) {
    console.warn('[Draft] Cannot save draft: userId required')
    return false
  }

  try {
    // Try DB-backed API first
    const response = await fetch('/api/sell/drafts/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData: draft.formData,
        images: draft.imageMetadata ? Array(draft.imageMetadata.count).fill('') : [],
        selectedCategory: draft.selectedCategory,
        selectedSubcategory: draft.selectedSubcategory,
        selectedBooster: draft.selectedBooster,
        paymentProtectionEnabled: draft.paymentProtectionEnabled,
        currentStep: draft.currentStep,
        titleImageIndex: draft.imageMetadata?.titleImageIndex || 0,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('[Draft] Saved to DB:', data.draftId)
      // Also save to localStorage as backup (without images)
      const draftWithTimestamp: ListingDraft = {
        ...draft,
        timestamp: Date.now(),
      }
      const draftKey = getDraftKey(userId)
      if (draftKey) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(draftWithTimestamp))
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      return true
    } else {
      console.warn('[Draft] API save failed, falling back to localStorage')
      throw new Error('API save failed')
    }
  } catch (error: any) {
    // Fallback to localStorage
    console.warn('[Draft] Falling back to localStorage:', error.message)
    try {
      // Migrate legacy draft if needed
      migrateLegacyDraft(userId)

      const draftKey = getDraftKey(userId)
      if (!draftKey) {
        return false
      }

      const draftWithTimestamp: ListingDraft = {
        ...draft,
        timestamp: Date.now(),
      }

      const draftJson = JSON.stringify(draftWithTimestamp)
      localStorage.setItem(draftKey, draftJson)
      return true
    } catch (localError: any) {
      if (localError.name === 'QuotaExceededError') {
        console.warn('[Draft] localStorage quota exceeded, skipping save')
      } else {
        console.error('[Draft] Error saving draft:', localError)
      }
      return false
    }
  }
}

/**
 * Load draft from DB via API (primary method)
 * Falls back to localStorage if API fails
 */
export async function loadDraft(userId?: string | null): Promise<ListingDraft | null> {
  if (typeof window === 'undefined') return null

  if (!userId) return null

  try {
    // Try DB-backed API first
    const response = await fetch('/api/sell/drafts/current')
    if (response.ok) {
      const data = await response.json()
      if (data.draft) {
        const draft = data.draft
        // Convert DB draft to ListingDraft format
        const listingDraft: ListingDraft = {
          formData: draft.formData,
          imageMetadata: {
            count: draft.images?.length || draft.draftImages?.length || 0,
            titleImageIndex: draft.titleImageIndex || 0,
          },
          selectedCategory: draft.selectedCategory || '',
          selectedSubcategory: draft.selectedSubcategory || '',
          selectedBooster: draft.selectedBooster || 'none',
          paymentProtectionEnabled: draft.paymentProtectionEnabled || false,
          currentStep: draft.currentStep || 0,
          timestamp: new Date(draft.updatedAt).getTime(),
        }
        console.log('[Draft] Loaded from DB:', draft.id)
        return listingDraft
      }
      // No draft found in DB, return null
      return null
    } else {
      throw new Error('API load failed')
    }
  } catch (error: any) {
    // Fallback to localStorage
    console.warn('[Draft] API load failed, trying localStorage:', error.message)
    try {
      // Migrate legacy draft if needed
      migrateLegacyDraft(userId)

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
    } catch (localError) {
      console.error('[Draft] Error loading draft:', localError)
      clearDraft(userId) // Clear corrupted draft
      return null
    }
  }
}

/**
 * Clear draft from DB via API (primary method)
 * Also clears localStorage
 */
export async function clearDraft(userId?: string | null, draftId?: string | null): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear from DB if draftId provided
  if (draftId && userId) {
    try {
      await fetch(`/api/sell/drafts/${draftId}`, {
        method: 'DELETE',
      })
      console.log('[Draft] Cleared from DB:', draftId)
    } catch (error) {
      console.error('[Draft] Error clearing draft from DB:', error)
    }
  }

  // Also clear localStorage
  try {
    const draftKey = getDraftKey(userId)
    if (draftKey) {
      localStorage.removeItem(draftKey)
    }
    // Also clear legacy key if exists
    localStorage.removeItem(LEGACY_DRAFT_KEY)
  } catch (error) {
    console.error('[Draft] Error clearing draft from localStorage:', error)
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
