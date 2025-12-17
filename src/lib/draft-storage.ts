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

const DRAFT_KEY = 'helvenda_listing_draft'
const MAX_DRAFT_AGE_DAYS = 7

export function saveDraft(draft: Omit<ListingDraft, 'timestamp'>): boolean {
  try {
    const draftWithTimestamp: ListingDraft = {
      ...draft,
      timestamp: Date.now(),
    }
    
    const draftJson = JSON.stringify(draftWithTimestamp)
    localStorage.setItem(DRAFT_KEY, draftJson)
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

export function loadDraft(): ListingDraft | null {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY)
    if (!draftJson) return null

    const draft: ListingDraft = JSON.parse(draftJson)
    const draftAge = Date.now() - draft.timestamp
    const maxAge = MAX_DRAFT_AGE_DAYS * 24 * 60 * 60 * 1000

    if (draftAge > maxAge) {
      // Draft too old, remove it
      clearDraft()
      return null
    }

    return draft
  } catch (error) {
    console.error('[Draft] Error loading draft:', error)
    clearDraft() // Clear corrupted draft
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch (error) {
    console.error('[Draft] Error clearing draft:', error)
  }
}

export function getDraftAge(): number | null {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY)
    if (!draftJson) return null

    const draft: ListingDraft = JSON.parse(draftJson)
    return Date.now() - draft.timestamp
  } catch {
    return null
  }
}

export function getDraftAgeDays(): number | null {
  const age = getDraftAge()
  if (age === null) return null
  return age / (1000 * 60 * 60 * 24)
}

