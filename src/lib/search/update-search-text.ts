/**
 * Service for updating searchText field on Watch records
 * 
 * This should be called:
 * - After creating a new watch
 * - After updating a watch
 * - During backfill for existing watches
 */

import { prisma } from '@/lib/prisma'
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
 */
export async function updateWatchSearchText(watchId: string): Promise<void> {
  // Fetch watch with all related data needed for search text
  const watch = await prisma.watch.findUnique({
    where: { id: watchId },
    include: {
      categories: {
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
      },
      seller: {
        select: { postalCode: true, city: true },
      },
    },
  })

  if (!watch) {
    console.warn(`[SearchText] Watch not found: ${watchId}`)
    return
  }

  const searchText = buildSearchText({
    title: watch.title,
    description: watch.description,
    brand: watch.brand,
    model: watch.model,
    condition: watch.condition,
    referenceNumber: watch.referenceNumber,
    material: watch.material,
    movement: watch.movement,
    year: watch.year,
    warranty: watch.warranty,
    warrantyDescription: watch.warrantyDescription,
    shippingMethod: watch.shippingMethod,
    categories: watch.categories,
    seller: watch.seller,
  })

  // Update the searchText field
  await prisma.watch.update({
    where: { id: watchId },
    data: { searchText },
  })

  console.log(`[SearchText] Updated searchText for watch ${watchId}`)
}

/**
 * Update searchText for a watch with provided data (no DB fetch needed)
 * Use this when you already have the watch data available
 */
export async function updateWatchSearchTextDirect(
  watchId: string,
  watchData: WatchWithRelations
): Promise<string> {
  const searchText = buildSearchText({
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

  await prisma.watch.update({
    where: { id: watchId },
    data: { searchText },
  })

  return searchText
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
 * Used for backfill operations
 */
export async function batchUpdateSearchText(
  watchIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (let i = 0; i < watchIds.length; i++) {
    try {
      await updateWatchSearchText(watchIds[i])
      success++
    } catch (error) {
      console.error(`[SearchText] Failed to update watch ${watchIds[i]}:`, error)
      failed++
    }

    if (onProgress) {
      onProgress(i + 1, watchIds.length)
    }
  }

  return { success, failed }
}

/**
 * Backfill all watches with searchText
 * Use this for initial population or migration
 */
export async function backfillAllSearchText(
  batchSize: number = 100,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; total: number }> {
  // Get total count
  const total = await prisma.watch.count()
  console.log(`[SearchText] Starting backfill for ${total} watches...`)

  let success = 0
  let failed = 0
  let offset = 0

  while (offset < total) {
    // Fetch batch of watches
    const watches = await prisma.watch.findMany({
      skip: offset,
      take: batchSize,
      include: {
        categories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
        seller: {
          select: { postalCode: true, city: true },
        },
      },
    })

    // Process batch
    for (const watch of watches) {
      try {
        const searchText = buildSearchText({
          title: watch.title,
          description: watch.description,
          brand: watch.brand,
          model: watch.model,
          condition: watch.condition,
          referenceNumber: watch.referenceNumber,
          material: watch.material,
          movement: watch.movement,
          year: watch.year,
          warranty: watch.warranty,
          warrantyDescription: watch.warrantyDescription,
          shippingMethod: watch.shippingMethod,
          categories: watch.categories,
          seller: watch.seller,
        })

        await prisma.watch.update({
          where: { id: watch.id },
          data: { searchText },
        })

        success++
      } catch (error) {
        console.error(`[SearchText] Failed to update watch ${watch.id}:`, error)
        failed++
      }
    }

    offset += batchSize

    if (onProgress) {
      onProgress(Math.min(offset, total), total)
    }

    console.log(`[SearchText] Progress: ${Math.min(offset, total)}/${total}`)
  }

  console.log(`[SearchText] Backfill complete. Success: ${success}, Failed: ${failed}`)
  return { success, failed, total }
}
