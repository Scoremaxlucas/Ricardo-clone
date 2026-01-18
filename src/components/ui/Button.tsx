import React, { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/haptics'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string // Accessible loading text for screen readers
  /** Enable haptic feedback on click (default: true) */
  hapticFeedback?: boolean
  children: React.ReactNode
}

/**
 * Button Component - Einheitliches Design-System
 *
 * ALLE Primary Buttons nutzen jetzt den Teal-Gradient für:
 * - Konsistenz auf der gesamten Platform
 * - Vertrauenswürdiges, professionelles Erscheinungsbild
 * - Passend zum Helvenda Brand
 *
 * Mobile Optimierungen:
 * - Minimum 44px Touch Target
 * - Haptic Feedback auf unterstützten Geräten
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Wird geladen...',
  hapticFeedback = true,
  className,
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  // Wrap onClick to add haptic feedback
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback && !disabled && !loading) {
      haptic.light()
    }
    onClick?.(e)
  }, [hapticFeedback, disabled, loading, onClick])
  // Minimum 44px touch target for mobile accessibility
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer min-h-[44px]'

  const variants = {
    primary: 'text-white rounded-lg focus:ring-primary-500 shadow-md hover:shadow-lg',
    secondary:
      'bg-white text-primary-600 border-2 border-primary-500 hover:bg-primary-50 focus:ring-primary-500 rounded-lg shadow-sm hover:shadow-md',
    outline:
      'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-500 hover:text-primary-600 focus:ring-primary-500 rounded-lg',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500 rounded-lg',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 rounded-lg shadow-md',
  }

  // Sizes ensure minimum 44px height for touch accessibility
  const sizes = {
    sm: 'px-4 py-2.5 text-sm',    // ~44px with text
    md: 'px-6 py-2.5 text-sm',    // ~44px with text
    lg: 'px-8 py-3 text-base',    // ~48px with text
  }

  // EINHEITLICH: Teal-Gradient für alle Primary Buttons
  const primaryStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
        }
      : {}

  const primaryHoverStyle =
    variant === 'primary'
      ? {
          transform: 'translateY(-1px)',
          boxShadow: '0px 6px 20px rgba(20, 184, 166, 0.35)',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        }
      : {}

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className,
        variant === 'primary' && 'hover:-translate-y-0.5 active:translate-y-0',
        variant === 'secondary' && 'hover:-translate-y-0.5 active:translate-y-0'
      )}
      style={variant === 'primary' ? primaryStyle : undefined}
      onMouseEnter={e => {
        if (variant === 'primary' && !disabled && !loading) {
          Object.assign(e.currentTarget.style, primaryHoverStyle)
        }
      }}
      onMouseLeave={e => {
        if (variant === 'primary' && !disabled && !loading) {
          Object.assign(e.currentTarget.style, primaryStyle)
        }
      }}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? loadingText : ariaLabel}
      {...props}
    >
      {loading && (
        <>
          {/* Screen reader announcement */}
          <span className="sr-only" role="status" aria-live="polite">
            {loadingText}
          </span>
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </>
      )}
      {children}
    </button>
  )
}
