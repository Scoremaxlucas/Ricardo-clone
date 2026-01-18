'use client'

import { haptic } from '@/lib/haptics'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  /** Minimum pull distance to trigger refresh (default: 80px) */
  threshold?: number
  /** Maximum pull distance (default: 150px) */
  maxPull?: number
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>
  /** Enable/disable the hook (default: true) */
  enabled?: boolean
  /** Container element ref - if not provided, uses window */
  containerRef?: React.RefObject<HTMLElement>
}

interface UsePullToRefreshReturn {
  /** Current pull distance (0 when not pulling) */
  pullDistance: number
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Whether user is currently pulling */
  isPulling: boolean
  /** Progress percentage (0-100) */
  progress: number
  /** Props to spread on the pull indicator element */
  indicatorProps: {
    style: React.CSSProperties
    'aria-hidden': boolean
  }
}

/**
 * Pull-to-Refresh Hook for Mobile
 * 
 * Implements native-feeling pull-to-refresh gesture for mobile devices.
 * Only activates when scrolled to top of the page/container.
 * 
 * @example
 * function MyList() {
 *   const { pullDistance, isRefreshing, indicatorProps } = usePullToRefresh({
 *     onRefresh: async () => {
 *       await fetchData()
 *     }
 *   })
 * 
 *   return (
 *     <div>
 *       <div {...indicatorProps}>
 *         {isRefreshing ? <Spinner /> : <ArrowDown />}
 *       </div>
 *       <ul>...</ul>
 *     </div>
 *   )
 * }
 */
export function usePullToRefresh({
  threshold = 80,
  maxPull = 150,
  onRefresh,
  enabled = true,
  containerRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  
  const startYRef = useRef<number | null>(null)
  const currentYRef = useRef<number>(0)
  const isAtTopRef = useRef(false)
  const hasTriggeredHapticRef = useRef(false)
  
  // Check if at top of scroll container
  const isAtTop = useCallback(() => {
    if (containerRef?.current) {
      return containerRef.current.scrollTop <= 0
    }
    return window.scrollY <= 0
  }, [containerRef])
  
  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    
    isAtTopRef.current = isAtTop()
    if (!isAtTopRef.current) return
    
    startYRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
    hasTriggeredHapticRef.current = false
  }, [enabled, isRefreshing, isAtTop])
  
  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing || startYRef.current === null) return
    if (!isAtTopRef.current) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current
    
    // Only activate on downward pull
    if (diff <= 0) {
      setPullDistance(0)
      setIsPulling(false)
      return
    }
    
    // Apply resistance for more natural feel
    const resistance = 0.5
    const resistedDiff = Math.min(diff * resistance, maxPull)
    
    currentYRef.current = currentY
    setPullDistance(resistedDiff)
    setIsPulling(true)
    
    // Trigger haptic when crossing threshold
    if (resistedDiff >= threshold && !hasTriggeredHapticRef.current) {
      haptic.medium()
      hasTriggeredHapticRef.current = true
    } else if (resistedDiff < threshold && hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = false
    }
    
    // Prevent default scroll if we're pulling
    if (resistedDiff > 10) {
      e.preventDefault()
    }
  }, [enabled, isRefreshing, maxPull, threshold])
  
  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return
    
    const finalPull = pullDistance
    
    setIsPulling(false)
    startYRef.current = null
    
    // Trigger refresh if pulled past threshold
    if (finalPull >= threshold) {
      setIsRefreshing(true)
      haptic.success()
      
      try {
        await onRefresh()
      } catch (error) {
        haptic.error()
        console.error('Pull-to-refresh error:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Animate back to 0
      setPullDistance(0)
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh])
  
  // Attach event listeners
  useEffect(() => {
    if (!enabled) return
    
    const target = containerRef?.current || document
    const options: AddEventListenerOptions = { passive: false }
    
    target.addEventListener('touchstart', handleTouchStart as EventListener, options)
    target.addEventListener('touchmove', handleTouchMove as EventListener, options)
    target.addEventListener('touchend', handleTouchEnd as EventListener)
    target.addEventListener('touchcancel', handleTouchEnd as EventListener)
    
    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener)
      target.removeEventListener('touchmove', handleTouchMove as EventListener)
      target.removeEventListener('touchend', handleTouchEnd as EventListener)
      target.removeEventListener('touchcancel', handleTouchEnd as EventListener)
    }
  }, [enabled, containerRef, handleTouchStart, handleTouchMove, handleTouchEnd])
  
  // Calculate progress percentage
  const progress = Math.min((pullDistance / threshold) * 100, 100)
  
  // Indicator styles
  const indicatorProps = {
    style: {
      transform: `translateY(${Math.min(pullDistance, maxPull)}px)`,
      opacity: Math.min(pullDistance / (threshold * 0.5), 1),
      transition: isPulling ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
    } as React.CSSProperties,
    'aria-hidden': pullDistance === 0 && !isRefreshing,
  }
  
  return {
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
    indicatorProps,
  }
}

export default usePullToRefresh
