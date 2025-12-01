import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

  const variants = {
    primary: 'text-white rounded-[50px] focus:ring-primary-500',
    secondary:
      'bg-white text-primary-600 border-2 border-primary-500 hover:bg-primary-500 hover:text-white focus:ring-primary-500 rounded-[50px]',
    outline:
      'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-500 focus:ring-primary-500 rounded-xl',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500 rounded-xl',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  // Gradient für Primary Button
  const primaryStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
          boxShadow: '0px 4px 20px rgba(20, 184, 166, 0.3)',
        }
      : {}

  const primaryHoverStyle =
    variant === 'primary'
      ? {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: '0px 8px 30px rgba(20, 184, 166, 0.4)',
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
        }
      : {}

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className,
        variant === 'primary' &&
          'hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]',
        variant === 'secondary' && 'hover:-translate-y-0.5 active:scale-[0.98]'
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
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
      )}
      {children}
    </button>
  )
}
