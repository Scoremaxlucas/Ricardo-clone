/**
 * Service Worker for Helvenda - PERFORMANCE OPTIMIERT
 *
 * Provides offline caching, PWA capabilities, and intelligent caching strategies
 * 
 * Caching Strategies:
 * - Static Assets: Cache First (CSS, JS, Fonts)
 * - Images: Cache First with Network Fallback
 * - API: Stale-While-Revalidate (fresh data, fast response)
 * - Pages: Network First with Cache Fallback
 */

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `helvenda-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `helvenda-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `helvenda-images-${CACHE_VERSION}`
const API_CACHE = `helvenda-api-${CACHE_VERSION}`

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/search',
  '/offline',
  '/manifest.json',
]

// Patterns for different caching strategies
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:js|css|woff2?|ttf|eot)$/,
]

const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)$/,
  /blob\.vercel-storage\.com/,
  /images\.unsplash\.com/,
]

const API_PATTERNS = [
  /\/api\/watches\/search/,
  /\/api\/categories/,
  /\/api\/search\/suggestions/,
  /\/api\/watches\/featured/,
]

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('helvenda-') && 
                   ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(name)
          })
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Helper: Check if URL matches patterns
const matchesPatterns = (url, patterns) => {
  return patterns.some(pattern => pattern.test(url))
}

// Strategy: Cache First (for static assets)
const cacheFirst = async (request, cacheName) => {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Strategy: Network First (for pages)
const networkFirst = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline')
    }
    return new Response('Offline', { status: 503 })
  }
}

// Strategy: Stale While Revalidate (for API calls)
const staleWhileRevalidate = async (request, cacheName, maxAge = 60000) => {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Fetch fresh data in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => cachedResponse)
  
  // Return cached immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = request.url
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip non-http(s) requests
  if (!url.startsWith('http')) {
    return
  }
  
  // Skip Chrome extension requests
  if (url.includes('chrome-extension')) {
    return
  }

  // Apply appropriate caching strategy
  if (matchesPatterns(url, STATIC_PATTERNS)) {
    // Static assets: Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (matchesPatterns(url, IMAGE_PATTERNS)) {
    // Images: Cache First with longer TTL
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (matchesPatterns(url, API_PATTERNS)) {
    // API calls: Stale While Revalidate (fast + fresh)
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
  } else if (request.mode === 'navigate') {
    // Page navigation: Network First
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  } else {
    // Default: Network with cache fallback
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
  }
})

// Background Sync for offline form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    // Handle syncing favorites when back online
  }
})





