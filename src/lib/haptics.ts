/**
 * Haptic Feedback Utility for Mobile Devices
 *
 * Provides tactile feedback for user interactions on supported devices.
 * Falls back gracefully on unsupported devices.
 *
 * @example
 * import { haptic } from '@/lib/haptics'
 *
 * // On button click
 * haptic.light()
 *
 * // On success
 * haptic.success()
 *
 * // On error
 * haptic.error()
 */

type HapticPattern = number | number[]

interface HapticFeedback {
  /** Light tap feedback - for button presses */
  light: () => void
  /** Medium feedback - for toggles, selections */
  medium: () => void
  /** Heavy feedback - for significant actions */
  heavy: () => void
  /** Success pattern - for completed actions */
  success: () => void
  /** Error pattern - for failed actions */
  error: () => void
  /** Warning pattern - for alerts */
  warning: () => void
  /** Selection changed - for picker/list selections */
  selection: () => void
  /** Custom pattern */
  custom: (pattern: HapticPattern) => void
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'vibrate' in navigator
}

/**
 * Trigger vibration with given pattern
 * Pattern can be a single duration or array of [vibrate, pause, vibrate, ...]
 */
function vibrate(pattern: HapticPattern): void {
  if (!isHapticSupported()) return

  try {
    navigator.vibrate(pattern)
  } catch (e) {
    // Silently fail - haptic feedback is non-critical
    console.debug('Haptic feedback not available:', e)
  }
}

/**
 * Haptic feedback patterns optimized for different interactions
 */
export const haptic: HapticFeedback = {
  // Light tap - subtle, for regular button presses
  light: () => vibrate(10),

  // Medium tap - more noticeable, for toggles
  medium: () => vibrate(20),

  // Heavy tap - strong, for significant actions
  heavy: () => vibrate(40),

  // Success - double pulse pattern
  success: () => vibrate([10, 50, 10]),

  // Error - triple pulse pattern (attention-grabbing)
  error: () => vibrate([50, 30, 50, 30, 50]),

  // Warning - double medium pulse
  warning: () => vibrate([30, 50, 30]),

  // Selection changed - very light
  selection: () => vibrate(5),

  // Custom pattern for special cases
  custom: (pattern: HapticPattern) => vibrate(pattern),
}

/**
 * React hook for haptic feedback
 * Returns haptic functions that are no-ops on server
 */
export function useHaptic(): HapticFeedback {
  return haptic
}

/**
 * Wrapper to add haptic feedback to any click handler
 *
 * @example
 * <button onClick={withHaptic(handleClick, 'light')}>Click me</button>
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  type: keyof Omit<HapticFeedback, 'custom'> = 'light'
): T {
  return ((...args: Parameters<T>) => {
    haptic[type]()
    return handler(...args)
  }) as T
}

/**
 * Higher-order function for async handlers with success/error haptics
 *
 * @example
 * const handleSubmit = withHapticAsync(async () => {
 *   await api.submit()
 * })
 */
export function withHapticAsync<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    haptic.light() // Initial feedback
    try {
      const result = await handler(...args)
      haptic.success()
      return result
    } catch (error) {
      haptic.error()
      throw error
    }
  }) as T
}

export default haptic
