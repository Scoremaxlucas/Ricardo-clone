import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Simple H */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 40 40"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="8" fill="#0f766e" />
          <path
            d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="ml-2.5">
        <div className="flex items-center gap-0.5">
          <span className={`${textSizeClasses[size]} font-bold text-gray-900`}>Helvenda</span>
          <span
            className={`${size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-xs' : 'text-sm'} text-gray-500`}
          >
            .ch
          </span>
        </div>
      </div>
    </div>
  )
}
