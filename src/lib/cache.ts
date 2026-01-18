/**
 * API Response Caching Utilities
 * 
 * Provides in-memory caching for frequently accessed data
 * with automatic expiration and cache invalidation.
 * 
 * In production, consider using Redis for distributed caching.
 */

// ============================================
// CACHE TYPES
// ============================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Tags for cache invalidation
  staleWhileRevalidate?: number // Serve stale data while fetching fresh
}

// ============================================
// IN-MEMORY CACHE STORE
// ============================================

const cache = new Map<string, CacheEntry<unknown>>()

// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Get a value from cache
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key)
  
  if (!entry) {
    return null
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  
  return entry.data as T
}

/**
 * Set a value in cache
 */
export function setInCache<T>(
  key: string,
  data: T,
  options?: CacheOptions
): void {
  const { ttl = 60, tags = [] } = options || {} // Default 60 seconds
  
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
    tags,
  })
}

/**
 * Delete a specific key from cache
 */
export function deleteFromCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache entries with a specific tag
 */
export function invalidateByTag(tag: string): number {
  let count = 0
  const entries = Array.from(cache.entries())
  
  for (const [key, entry] of entries) {
    if (entry.tags.includes(tag)) {
      cache.delete(key)
      count++
    }
  }
  
  return count
}

/**
 * Invalidate all cache entries matching a pattern
 */
export function invalidateByPattern(pattern: RegExp): number {
  let count = 0
  const keys = Array.from(cache.keys())
  
  for (const key of keys) {
    if (pattern.test(key)) {
      cache.delete(key)
      count++
    }
  }
  
  return count
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  keys: string[]
  memoryEstimate: number
} {
  const keys = Array.from(cache.keys())
  const entries = Array.from(cache.entries())
  
  // Rough memory estimate (not accurate but gives an idea)
  let memoryEstimate = 0
  for (const [key, entry] of entries) {
    memoryEstimate += key.length * 2 // Key string
    memoryEstimate += JSON.stringify(entry.data).length * 2 // Data (rough)
  }
  
  return {
    size: cache.size,
    keys,
    memoryEstimate,
  }
}

// ============================================
// CACHE DECORATOR / WRAPPER
// ============================================

/**
 * Wrap a function with caching
 * 
 * @example
 * const getUser = withCache(
 *   (id: string) => prisma.user.findUnique({ where: { id } }),
 *   (id) => `user:${id}`,
 *   { ttl: 300 } // 5 minutes
 * )
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  getCacheKey: (...args: TArgs) => string,
  options?: CacheOptions
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = getCacheKey(...args)
    
    // Try to get from cache
    const cached = getFromCache<TResult>(key)
    if (cached !== null) {
      return cached
    }
    
    // Fetch fresh data
    const result = await fn(...args)
    
    // Store in cache
    setInCache(key, result, options)
    
    return result
  }
}

/**
 * Stale-while-revalidate caching pattern
 * Returns stale data immediately while fetching fresh data in background
 */
export function withStaleWhileRevalidate<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  getCacheKey: (...args: TArgs) => string,
  options?: CacheOptions & { staleTime?: number }
): (...args: TArgs) => Promise<TResult> {
  const { staleTime = 30, ...cacheOptions } = options || {}
  const refreshing = new Set<string>()
  
  return async (...args: TArgs): Promise<TResult> => {
    const key = getCacheKey(...args)
    const entry = cache.get(key)
    
    // Fresh cache hit
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data as TResult
    }
    
    // Stale cache hit - return stale and refresh in background
    if (entry && Date.now() < entry.expiresAt + staleTime * 1000) {
      // Don't refresh if already refreshing
      if (!refreshing.has(key)) {
        refreshing.add(key)
        fn(...args)
          .then(result => {
            setInCache(key, result, cacheOptions)
          })
          .catch(console.error)
          .finally(() => {
            refreshing.delete(key)
          })
      }
      return entry.data as TResult
    }
    
    // No cache or too stale - fetch fresh
    const result = await fn(...args)
    setInCache(key, result, cacheOptions)
    return result
  }
}

// ============================================
// PREDEFINED CACHE KEYS
// ============================================

export const CacheKeys = {
  // Categories
  categories: () => 'categories:all',
  category: (id: string) => `category:${id}`,
  
  // Users
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  
  // Watches
  watch: (id: string) => `watch:${id}`,
  watchList: (params: string) => `watches:list:${params}`,
  watchSearch: (query: string) => `watches:search:${query}`,
  
  // Settings
  feeSettings: () => 'settings:fees',
  shippingRates: () => 'settings:shipping',
  boosterPrices: () => 'settings:boosters',
  
  // Statistics
  platformStats: () => 'stats:platform',
  userStats: (id: string) => `stats:user:${id}`,
}

// ============================================
// CACHE TAGS FOR INVALIDATION
// ============================================

export const CacheTags = {
  // Entity tags
  categories: 'tag:categories',
  users: 'tag:users',
  watches: 'tag:watches',
  orders: 'tag:orders',
  settings: 'tag:settings',
  
  // User-specific tags
  user: (id: string) => `tag:user:${id}`,
  
  // Watch-specific tags
  watch: (id: string) => `tag:watch:${id}`,
}

// ============================================
// CACHE CLEANUP
// ============================================

/**
 * Clean up expired cache entries
 * Call this periodically (e.g., every minute)
 */
export function cleanupExpiredEntries(): number {
  let count = 0
  const now = Date.now()
  const entries = Array.from(cache.entries())
  
  for (const [key, entry] of entries) {
    if (now > entry.expiresAt) {
      cache.delete(key)
      count++
    }
  }
  
  return count
}

// Auto-cleanup every 5 minutes (in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

// ============================================
// REACT QUERY / SWR COMPATIBLE HELPERS
// ============================================

/**
 * Generate cache key for React Query / SWR
 */
export function createQueryKey<T extends string | Record<string, unknown>[]>(
  ...parts: T[]
): string {
  return parts
    .map(part => (typeof part === 'object' ? JSON.stringify(part) : part))
    .join(':')
}

/**
 * Default cache times (in seconds)
 */
export const CacheTimes = {
  SHORT: 30, // 30 seconds
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  
  // Specific use cases
  USER_PROFILE: 300, // 5 minutes
  CATEGORIES: 3600, // 1 hour (rarely changes)
  WATCH_LIST: 60, // 1 minute (frequently changes)
  WATCH_DETAIL: 120, // 2 minutes
  SETTINGS: 3600, // 1 hour
  SEARCH_RESULTS: 60, // 1 minute
}
