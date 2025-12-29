/**
 * Search Text Builder Service
 * Builds a comprehensive search text field from all relevant listing data
 * 
 * This enables finding items by:
 * - Title, description, brand, model
 * - Category names (even if title doesn't contain them)
 * - Generated keywords from categories
 * - Condition descriptions
 * - Location information
 * - Delivery/shipping methods
 */

import { categoryKeywordsForSearch } from './search-keywords'

interface WatchDataForSearch {
  title: string
  description?: string | null
  brand: string
  model: string
  condition: string
  referenceNumber?: string | null
  material?: string | null
  movement?: string | null
  year?: number | null
  warranty?: string | null
  warrantyDescription?: string | null
  shippingMethod?: string | null
  // Category information
  categories?: Array<{
    category: {
      name: string
      slug: string
    }
  }>
  // Seller location
  seller?: {
    postalCode?: string | null
    city?: string | null
  } | null
}

/**
 * Normalize text for search indexing
 * - Lowercase
 * - Replace German umlauts (ä->ae, ö->oe, ü->ue, ß->ss)
 * - Remove accents
 * - Collapse whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get condition label in German for indexing
 */
function getConditionLabel(condition: string): string {
  const conditionLabels: Record<string, string> = {
    'new': 'neu neuwertig unbenutzt originalverpackt ovp',
    'like-new': 'wie neu neuwertig kaum benutzt fast neu',
    'very-good': 'sehr gut gepflegt einwandfrei',
    'good': 'gut gebraucht funktioniert',
    'acceptable': 'akzeptabel gebraucht',
    'defective': 'defekt reparaturbedürftig',
  }
  return conditionLabels[condition] || condition
}

/**
 * Parse and expand shipping methods
 */
function getShippingKeywords(shippingMethod: string | null | undefined): string {
  if (!shippingMethod) return ''
  
  const keywords: string[] = []
  
  try {
    const shipping = JSON.parse(shippingMethod)
    
    if (shipping.delivery || shipping.shipping) {
      keywords.push('versand', 'lieferung', 'shipping', 'delivery')
    }
    if (shipping.pickup || shipping.abholung) {
      keywords.push('abholung', 'selbstabholung', 'pickup', 'abholen')
    }
    if (shipping.freeShipping) {
      keywords.push('gratis versand', 'kostenloser versand', 'free shipping')
    }
  } catch {
    // If not JSON, treat as plain string
    if (shippingMethod.toLowerCase().includes('versand') || shippingMethod.toLowerCase().includes('shipping')) {
      keywords.push('versand', 'lieferung')
    }
    if (shippingMethod.toLowerCase().includes('abhol') || shippingMethod.toLowerCase().includes('pickup')) {
      keywords.push('abholung', 'selbstabholung')
    }
  }
  
  return keywords.join(' ')
}

/**
 * Generate additional keywords based on category
 * This ensures items are findable even if the title doesn't contain category-related words
 */
function getCategoryKeywords(categorySlug: string): string[] {
  return categoryKeywordsForSearch[categorySlug] || []
}

/**
 * Build the comprehensive search text field
 * 
 * Priority order (reflected in repetition/weight):
 * 1. Title (repeated 3x for highest weight)
 * 2. Brand + Model (repeated 2x)
 * 3. Category names + keywords
 * 4. Description
 * 5. Other attributes (condition, location, shipping)
 */
export function buildSearchText(watch: WatchDataForSearch): string {
  const parts: string[] = []
  
  // 1. TITLE - Highest priority (repeated for weight)
  if (watch.title) {
    const normalizedTitle = normalizeText(watch.title)
    parts.push(normalizedTitle)
    parts.push(normalizedTitle) // Repeat for weight
    parts.push(normalizedTitle) // Repeat for weight
  }
  
  // 2. BRAND + MODEL - High priority (repeated for weight)
  if (watch.brand) {
    const normalizedBrand = normalizeText(watch.brand)
    parts.push(normalizedBrand)
    parts.push(normalizedBrand) // Repeat for weight
  }
  if (watch.model) {
    const normalizedModel = normalizeText(watch.model)
    parts.push(normalizedModel)
    parts.push(normalizedModel) // Repeat for weight
  }
  
  // 3. CATEGORIES - Important for semantic search
  if (watch.categories && watch.categories.length > 0) {
    for (const catRelation of watch.categories) {
      const category = catRelation.category
      if (category.name) {
        parts.push(normalizeText(category.name))
      }
      if (category.slug) {
        // Add category-specific keywords
        const keywords = getCategoryKeywords(category.slug)
        parts.push(...keywords.map(normalizeText))
      }
    }
  }
  
  // 4. DESCRIPTION - Medium priority
  if (watch.description) {
    parts.push(normalizeText(watch.description))
  }
  
  // 5. REFERENCE NUMBER
  if (watch.referenceNumber) {
    parts.push(normalizeText(watch.referenceNumber))
  }
  
  // 6. CONDITION - Expand to include descriptive terms
  if (watch.condition) {
    parts.push(normalizeText(watch.condition))
    parts.push(getConditionLabel(watch.condition))
  }
  
  // 7. MATERIAL
  if (watch.material) {
    parts.push(normalizeText(watch.material))
  }
  
  // 8. MOVEMENT (for watches)
  if (watch.movement) {
    parts.push(normalizeText(watch.movement))
  }
  
  // 9. YEAR
  if (watch.year) {
    parts.push(String(watch.year))
  }
  
  // 10. WARRANTY
  if (watch.warranty) {
    parts.push(normalizeText(watch.warranty))
    parts.push('garantie', 'warranty')
  }
  if (watch.warrantyDescription) {
    parts.push(normalizeText(watch.warrantyDescription))
  }
  
  // 11. LOCATION
  if (watch.seller?.city) {
    parts.push(normalizeText(watch.seller.city))
  }
  if (watch.seller?.postalCode) {
    parts.push(watch.seller.postalCode)
  }
  
  // 12. SHIPPING
  const shippingKeywords = getShippingKeywords(watch.shippingMethod)
  if (shippingKeywords) {
    parts.push(shippingKeywords)
  }
  
  // Combine all parts, normalize, and remove duplicates while preserving order
  const combined = parts.join(' ')
  const normalized = normalizeText(combined)
  
  // Remove excessive whitespace and return
  return normalized.replace(/\s+/g, ' ').trim()
}

/**
 * Extract important keywords from a search text for synonym expansion
 */
export function extractKeywords(searchText: string): string[] {
  const normalized = normalizeText(searchText)
  const words = normalized.split(/\s+/)
  
  // Filter out very short words and common stop words
  const stopWords = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des',
    'ein', 'eine', 'einer', 'einem', 'einen',
    'und', 'oder', 'aber', 'doch', 'wenn', 'weil',
    'ist', 'sind', 'war', 'waren', 'wird', 'werden',
    'hat', 'haben', 'hatte', 'hatten',
    'für', 'mit', 'bei', 'von', 'zu', 'zur', 'zum',
    'auf', 'aus', 'nach', 'vor', 'über', 'unter',
    'durch', 'gegen', 'ohne', 'um', 'an', 'in', 'im',
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall',
    'for', 'with', 'at', 'by', 'from', 'to', 'of', 'on', 'in'
  ])
  
  return words.filter(word => 
    word.length >= 2 && !stopWords.has(word)
  )
}
