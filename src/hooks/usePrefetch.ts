'use client'
/**
 * usePrefetch - Intelligentes Route Prefetching
 * 
 * Optimiert Navigation durch:
 * - Prefetch bei Hover (Intent-basiert)
 * - Prefetch wichtiger Routen beim Idle
 * - API-Daten Prefetch
 */

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

// Kritische Routen die immer prefetched werden sollten
const CRITICAL_ROUTES = [
  '/',
  '/search',
  '/sell',
  '/login',
]

// Routen die bei Idle prefetched werden
const IDLE_PREFETCH_ROUTES = [
  '/favorites',
  '/auctions',
  '/my-watches',
  '/notifications',
  '/profile',
]

export function usePrefetch() {
  const router = useRouter()
  const prefetchedRoutes = useRef<Set<string>>(new Set())
  const prefetchQueue = useRef<string[]>([])
  const isProcessing = useRef(false)

  // Prefetch einzelne Route
  const prefetchRoute = useCallback((href: string) => {
    if (prefetchedRoutes.current.has(href)) return
    
    prefetchedRoutes.current.add(href)
    router.prefetch(href)
  }, [router])

  // Prefetch bei Hover (Intent-based)
  const prefetchOnHover = useCallback((href: string) => {
    if (prefetchedRoutes.current.has(href)) return
    
    // Sofortiges Prefetch bei Hover
    prefetchRoute(href)
  }, [prefetchRoute])

  // Prefetch API-Daten
  const prefetchAPI = useCallback((url: string) => {
    // Nur wenn Browser idle ist
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        fetch(url, { 
          method: 'GET',
          priority: 'low' as any,
        }).catch(() => {
          // Silent fail
        })
      }, { timeout: 2000 })
    }
  }, [])

  // Verarbeite Prefetch-Queue im Idle
  const processQueue = useCallback(() => {
    if (isProcessing.current || prefetchQueue.current.length === 0) return
    
    isProcessing.current = true
    
    const processNext = () => {
      const route = prefetchQueue.current.shift()
      if (route) {
        prefetchRoute(route)
        // Kurze Pause zwischen Prefetches
        setTimeout(processNext, 100)
      } else {
        isProcessing.current = false
      }
    }
    
    processNext()
  }, [prefetchRoute])

  // Prefetch kritische Routen sofort, andere bei Idle
  useEffect(() => {
    // Kritische Routen sofort prefetchen
    CRITICAL_ROUTES.forEach(route => {
      prefetchRoute(route)
    })

    // Idle Prefetch für sekundäre Routen
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        IDLE_PREFETCH_ROUTES.forEach(route => {
          prefetchQueue.current.push(route)
        })
        processQueue()
      }, { timeout: 3000 })
    }
  }, [prefetchRoute, processQueue])

  return {
    prefetchRoute,
    prefetchOnHover,
    prefetchAPI,
  }
}

/**
 * Globaler Event-Listener für Link Hover Prefetching
 * Wird in Layout eingebunden
 */
export function PrefetchOnHover() {
  const router = useRouter()
  const prefetched = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Event Delegation für alle Links
    const handleMouseOver = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]')
      if (!link) return
      
      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || prefetched.current.has(href)) {
        return
      }
      
      prefetched.current.add(href)
      router.prefetch(href)
    }

    // Delegated Event auf document
    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
    }
  }, [router])

  return null
}
