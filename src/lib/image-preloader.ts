/**
 * Image Preloader Utility
 *
 * Preloads images in the background to improve perceived performance.
 * Similar to Ricardo's image loading strategy.
 */

class ImagePreloader {
  private preloadedImages = new Set<string>()
  private preloadQueue: string[] = []
  private isPreloading = false
  private maxConcurrent = 3 // Load 3 images at a time

  /**
   * Preload a single image
   */
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(src)) {
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        this.preloadedImages.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Preload multiple images with concurrency control
   */
  async preloadImages(urls: string[]): Promise<void> {
    const uniqueUrls = Array.from(new Set(urls.filter(Boolean)))
    const toPreload = uniqueUrls.filter(url => !this.preloadedImages.has(url))

    if (toPreload.length === 0) return

    // Add to queue
    this.preloadQueue.push(...toPreload)

    if (this.isPreloading) return

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, this.maxConcurrent)
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url).catch(() => {
          // Silently fail - don't block other images
        }))
      )
    }

    this.isPreloading = false
  }

  /**
   * Check if image is already preloaded
   */
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src)
  }

  /**
   * Clear preloaded cache
   */
  clear(): void {
    this.preloadedImages.clear()
    this.preloadQueue = []
  }
}

export const imagePreloader = new ImagePreloader()

/**
 * Preload images for product cards
 */
export function preloadProductImages(products: Array<{ images?: string[] }>): void {
  if (typeof window === 'undefined') return

  const imageUrls: string[] = []
  products.forEach(product => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0]
      // Only preload URLs, not Base64 (they're already in memory)
      if (firstImage && !firstImage.startsWith('data:') && !firstImage.startsWith('blob:')) {
        imageUrls.push(firstImage)
      }
    }
  })

  if (imageUrls.length > 0) {
    // Preload in background, don't block
    imagePreloader.preloadImages(imageUrls).catch(() => {
      // Silently fail
    })
  }
}











