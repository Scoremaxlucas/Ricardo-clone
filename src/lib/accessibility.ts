/**
 * Accessibility Utilities
 *
 * Provides helpers for:
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation
 * - ARIA attributes
 */

// ============================================
// SCREEN READER ANNOUNCEMENTS
// ============================================

/**
 * Announce a message to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the announcer element
  let announcer = document.getElementById('sr-announcer')

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'sr-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(announcer)
  }

  // Update priority if different
  if (announcer.getAttribute('aria-live') !== priority) {
    announcer.setAttribute('aria-live', priority)
  }

  // Clear and set message (this triggers the announcement)
  announcer.textContent = ''
  requestAnimationFrame(() => {
    announcer!.textContent = message
  })
}

/**
 * Announce a loading state
 */
export function announceLoading(isLoading: boolean, context?: string): void {
  if (isLoading) {
    announce(context ? `${context} wird geladen...` : 'Wird geladen...', 'polite')
  }
}

/**
 * Announce a success message
 */
export function announceSuccess(message: string): void {
  announce(message, 'polite')
}

/**
 * Announce an error message
 */
export function announceError(message: string): void {
  announce(message, 'assertive')
}

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Focus trap for modals and dialogs
 * Returns cleanup function
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeydown)

  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeydown)
  }
}

/**
 * Save and restore focus when opening/closing modals
 */
export function useFocusReturn(): {
  saveFocus: () => void
  restoreFocus: () => void
} {
  let previousActiveElement: HTMLElement | null = null

  return {
    saveFocus: () => {
      previousActiveElement = document.activeElement as HTMLElement
    },
    restoreFocus: () => {
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    },
  }
}

/**
 * Move focus to a specific element
 * Useful after page navigation or dynamic content updates
 */
export function moveFocusTo(selector: string | HTMLElement): void {
  const element = typeof selector === 'string'
    ? document.querySelector<HTMLElement>(selector)
    : selector

  if (element) {
    // Make element focusable if it isn't
    if (!element.hasAttribute('tabindex') && !isFocusableElement(element)) {
      element.setAttribute('tabindex', '-1')
    }
    element.focus()
  }
}

/**
 * Check if an element is naturally focusable
 */
function isFocusableElement(element: HTMLElement): boolean {
  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
  return (
    focusableTags.includes(element.tagName) ||
    element.hasAttribute('href') ||
    element.hasAttribute('tabindex')
  )
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

/**
 * Enable arrow key navigation in a list
 * Returns cleanup function
 */
export function enableArrowNavigation(
  container: HTMLElement,
  options?: {
    selector?: string
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    onSelect?: (element: HTMLElement) => void
  }
): () => void {
  const {
    selector = '[role="option"], [role="menuitem"], [role="tab"], li',
    orientation = 'vertical',
    loop = true,
    onSelect,
  } = options || {}

  const getItems = () => Array.from(container.querySelectorAll<HTMLElement>(selector))

  const handleKeydown = (e: KeyboardEvent) => {
    const items = getItems()
    if (items.length === 0) return

    const currentIndex = items.findIndex(item => item === document.activeElement)
    let nextIndex: number | null = null

    // Determine direction based on key and orientation
    const isUp = e.key === 'ArrowUp'
    const isDown = e.key === 'ArrowDown'
    const isLeft = e.key === 'ArrowLeft'
    const isRight = e.key === 'ArrowRight'
    const isHome = e.key === 'Home'
    const isEnd = e.key === 'End'
    const isEnter = e.key === 'Enter' || e.key === ' '

    // Handle selection
    if (isEnter && currentIndex !== -1) {
      e.preventDefault()
      onSelect?.(items[currentIndex])
      return
    }

    // Handle navigation
    if (
      (orientation !== 'horizontal' && (isUp || isDown)) ||
      (orientation !== 'vertical' && (isLeft || isRight)) ||
      isHome || isEnd
    ) {
      e.preventDefault()

      if (isHome) {
        nextIndex = 0
      } else if (isEnd) {
        nextIndex = items.length - 1
      } else if (isUp || isLeft) {
        nextIndex = currentIndex > 0
          ? currentIndex - 1
          : (loop ? items.length - 1 : 0)
      } else if (isDown || isRight) {
        nextIndex = currentIndex < items.length - 1
          ? currentIndex + 1
          : (loop ? 0 : items.length - 1)
      }

      if (nextIndex !== null && items[nextIndex]) {
        items[nextIndex].focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeydown)

  return () => {
    container.removeEventListener('keydown', handleKeydown)
  }
}

// ============================================
// ARIA HELPERS
// ============================================

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateId(prefix: string = 'helvenda'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create ARIA describedby relationship
 */
export function createDescribedBy(
  element: HTMLElement,
  description: string
): () => void {
  const descriptionId = generateId('desc')

  // Create description element
  const descEl = document.createElement('div')
  descEl.id = descriptionId
  descEl.className = 'sr-only'
  descEl.textContent = description
  element.parentElement?.appendChild(descEl)

  // Link to element
  element.setAttribute('aria-describedby', descriptionId)

  // Return cleanup function
  return () => {
    element.removeAttribute('aria-describedby')
    descEl.remove()
  }
}

/**
 * ARIA attributes for expandable elements
 */
export function getExpandableProps(
  isExpanded: boolean,
  controlsId: string
): {
  'aria-expanded': boolean
  'aria-controls': string
} {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }
}

/**
 * ARIA attributes for selected items in a list
 */
export function getSelectableProps(
  isSelected: boolean
): {
  'aria-selected': boolean
  tabIndex: number
} {
  return {
    'aria-selected': isSelected,
    tabIndex: isSelected ? 0 : -1,
  }
}

// ============================================
// SKIP LINKS
// ============================================

/**
 * Create skip link HTML
 */
export function createSkipLink(targetId: string, label: string): string {
  return `
    <a
      href="#${targetId}"
      class="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
    >
      ${label}
    </a>
  `
}

// ============================================
// COLOR CONTRAST
// ============================================

/**
 * Check if text color has sufficient contrast against background
 * Returns WCAG compliance level
 */
export function checkContrast(
  foreground: string,
  background: string
): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  const ratio = getContrastRatio(foreground, background)

  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get relative luminance of a color
 */
function getLuminance(color: string): number {
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  const [r, g, b] = rgb.map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(normalDuration: number): number {
  return prefersReducedMotion() ? 0 : normalDuration
}
