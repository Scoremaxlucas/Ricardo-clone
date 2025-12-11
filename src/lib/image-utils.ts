/**
 * Image utility functions
 * Helper functions for handling image URLs and determining optimization settings
 */

/**
 * Check if an image URL should bypass Next.js optimization
 * Returns true for:
 * - Base64 data URLs (data:image/...)
 * - Blob URLs (blob:...)
 * - Vercel Blob Storage URLs (blob.vercel-storage.com)
 */
export function shouldUnoptimizeImage(url: string | null | undefined): boolean {
  if (!url) return false

  return (
    url.startsWith('data:image/') ||
    url.startsWith('data:video/') ||
    url.startsWith('blob:') ||
    url.includes('blob.vercel-storage.com') ||
    url.includes('public.blob.vercel-storage.com')
  )
}

/**
 * Check if an image is a base64 data URL
 */
export function isBase64Image(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('data:image/') || (url.length > 1000 && !url.startsWith('http'))
}
