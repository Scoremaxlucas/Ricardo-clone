/**
 * Service for updating searchText field on Watch records
 * 
 * NOTE: This service is temporarily disabled because the searchText column
 * doesn't exist in the production database yet. 
 * Run migration 20250629_add_search_text_fts to enable this functionality.
 * 
 * This should be called:
 * - After creating a new watch
 * - After updating a watch
 * - During backfill for existing watches
 */

// import { prisma } from '@/lib/prisma'
import { buildSearchText } from './search-text-builder'

interface WatchWithRelations {
  id: string
  title: string
  description: string | null
  brand: string
  model: string
  condition: string
  referenceNumber: string | null
  material: string | null
  movement: string | null
  year: number | null
  warranty: string | null
  warrantyDescription: string | null
  shippingMethod: string | null
  categories?: Array<{
    category: {
      name: string
      slug: string
    }
  }>
  seller?: {
    postalCode: string | null
    city: string | null
  } | null
}

/**
 * Update searchText for a single watch
 * DISABLED: searchText column not in production DB
 */
export async function updateWatchSearchText(watchId: string): Promise<void> {
  // DISABLED: searchText column doesn't exist in production DB yet
  console.log(`[SearchText] SKIPPED - searchText column not available. Watch: ${watchId}`)
  return
}

/**
 * Update searchText for a watch with provided data (no DB fetch needed)
 * DISABLED: searchText column not in production DB
 */
export async function updateWatchSearchTextDirect(
  watchId: string,
  watchData: WatchWithRelations
): Promise<string> {
  // DISABLED: searchText column doesn't exist in production DB yet
  console.log(`[SearchText] SKIPPED - searchText column not available. Watch: ${watchId}`)
  
  // Still build and return the text for potential future use
  return buildSearchText({
    title: watchData.title,
    description: watchData.description,
    brand: watchData.brand,
    model: watchData.model,
    condition: watchData.condition,
    referenceNumber: watchData.referenceNumber,
    material: watchData.material,
    movement: watchData.movement,
    year: watchData.year,
    warranty: watchData.warranty,
    warrantyDescription: watchData.warrantyDescription,
    shippingMethod: watchData.shippingMethod,
    categories: watchData.categories,
    seller: watchData.seller,
  })
}

/**
 * Build searchText without updating DB
 * Useful for create operations where you want to include searchText in the initial create
 */
export function buildSearchTextForWatch(watchData: {
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
  categoryName?: string | null
  categorySlug?: string | null
  sellerCity?: string | null
  sellerPostalCode?: string | null
}): string {
  // Build categories array from single category
  const categories = watchData.categorySlug
    ? [{ category: { name: watchData.categoryName || '', slug: watchData.categorySlug } }]
    : undefined

  // Build seller object
  const seller = (watchData.sellerCity || watchData.sellerPostalCode)
    ? { city: watchData.sellerCity || null, postalCode: watchData.sellerPostalCode || null }
    : null

  return buildSearchText({
    title: watchData.title,
    description: watchData.description,
    brand: watchData.brand,
    model: watchData.model,
    condition: watchData.condition,
    referenceNumber: watchData.referenceNumber,
    material: watchData.material,
    movement: watchData.movement,
    year: watchData.year,
    warranty: watchData.warranty,
    warrantyDescription: watchData.warrantyDescription,
    shippingMethod: watchData.shippingMethod,
    categories,
    seller,
  })
}

/**
 * Batch update searchText for multiple watches
 * DISABLED: searchText column not in production DB
 */
export async function batchUpdateSearchText(
  watchIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  // DISABLED: searchText column doesn't exist in production DB yet
  console.log(`[SearchText] SKIPPED batch update - searchText column not available. Count: ${watchIds.length}`)
  
  if (onProgress) {
    onProgress(watchIds.length, watchIds.length)
  }
  
  return { success: 0, failed: 0 }
}

/**
 * Backfill all watches with searchText
 * DISABLED: searchText column not in production DB
 */
export async function backfillAllSearchText(
  batchSize: number = 100,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; total: number }> {
  // DISABLED: searchText column doesn't exist in production DB yet
  console.log('[SearchText] SKIPPED backfill - searchText column not available')
  
  if (onProgress) {
    onProgress(0, 0)
  }
  
  return { success: 0, failed: 0, total: 0 }
}
