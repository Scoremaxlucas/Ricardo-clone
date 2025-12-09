/**
 * In-Memory API Response Cache
 * 
 * Caches frequently accessed API responses to reduce database load
 * and improve response times.
 * 
 * Features:
 * - TTL-based expiration
 * - Automatic cleanup of expired entries
 * - Memory-efficient (max 1000 entries)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache entry with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Singleton instance
export const apiCache = new APICache()

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&')
  return `${endpoint}?${sortedParams}`
}

/**
 * Cache middleware for API routes
 * 
 * Usage:
 * ```typescript
 * const cacheKey = generateCacheKey('/api/watches', { page: 1, limit: 10 })
 * const cached = apiCache.get(cacheKey)
 * if (cached) return NextResponse.json(cached)
 * 
 * // ... fetch data ...
 * 
 * apiCache.set(cacheKey, data, 60000) // Cache for 60 seconds
 * ```
 */

