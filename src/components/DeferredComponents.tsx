'use client'

/**
 * DeferredComponents - Verzögert nicht-kritisches JavaScript
 * 
 * Diese Komponente lädt nicht-kritische Features erst nach:
 * 1. First Paint (visuelles Feedback)
 * 2. TTI (Time to Interactive) - User kann klicken
 * 3. Idle - Browser hat Zeit
 * 
 * Erwartete TTI-Verbesserung: 200-400ms
 */

import { useEffect, useState, lazy, Suspense } from 'react'

// Lazy imports für nicht-kritische Komponenten
const LazyServiceWorker = lazy(() => 
  import('@/components/ServiceWorker').then(m => ({ default: m.ServiceWorker }))
)
const LazyEmmaChat = lazy(() => 
  import('@/components/emma/EmmaChat').then(m => ({ default: m.EmmaChat }))
)
const LazyPrefetchOnHover = lazy(() => 
  import('@/hooks/usePrefetch').then(m => ({ default: m.PrefetchOnHover }))
)

type DeferLevel = 'immediate' | 'afterPaint' | 'afterTTI' | 'idle'

interface DeferredComponentsProps {
  children?: React.ReactNode
}

export function DeferredComponents({ children }: DeferredComponentsProps) {
  const [paintComplete, setPaintComplete] = useState(false)
  const [ttiComplete, setTtiComplete] = useState(false)
  const [idleComplete, setIdleComplete] = useState(false)

  useEffect(() => {
    // Phase 1: After First Paint (~16ms)
    // Verwende requestAnimationFrame für nächsten Frame
    const paintRaf = requestAnimationFrame(() => {
      setPaintComplete(true)
    })

    // Phase 2: After TTI (~100-200ms)
    // Gibt dem Browser Zeit für kritische JS-Ausführung
    const ttiTimeout = setTimeout(() => {
      setTtiComplete(true)
    }, 150)

    // Phase 3: Idle (~500-3000ms)
    // Nutze requestIdleCallback für nicht-kritische Tasks
    let idleCallback: number | NodeJS.Timeout

    if ('requestIdleCallback' in window) {
      idleCallback = (window as any).requestIdleCallback(() => {
        setIdleComplete(true)
      }, { timeout: 3000 })
    } else {
      // Fallback für Safari
      idleCallback = setTimeout(() => {
        setIdleComplete(true)
      }, 500)
    }

    return () => {
      cancelAnimationFrame(paintRaf)
      clearTimeout(ttiTimeout)
      if ('cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleCallback)
      } else {
        clearTimeout(idleCallback as NodeJS.Timeout)
      }
    }
  }, [])

  return (
    <>
      {/* Children werden sofort gerendert */}
      {children}

      {/* Phase 1: Nach First Paint - Prefetch vorbereiten */}
      {paintComplete && (
        <Suspense fallback={null}>
          <LazyPrefetchOnHover />
        </Suspense>
      )}

      {/* Phase 2: Nach TTI - Service Worker registrieren */}
      {ttiComplete && (
        <Suspense fallback={null}>
          <LazyServiceWorker />
        </Suspense>
      )}

      {/* Phase 3: Idle - AI Chat laden */}
      {idleComplete && (
        <Suspense fallback={null}>
          <LazyEmmaChat />
        </Suspense>
      )}
    </>
  )
}

/**
 * Hook für Intersection Observer basiertes Lazy Loading
 */
export function useIntersectionLoader(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '100px' }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, threshold])

  return { setRef, isVisible }
}

/**
 * Wrapper für Below-the-Fold Komponenten
 */
export function LazyWhenVisible({ 
  children, 
  fallback = null,
  minHeight = '200px' 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string
}) {
  const { setRef, isVisible } = useIntersectionLoader()

  return (
    <div ref={setRef} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : fallback}
    </div>
  )
}
