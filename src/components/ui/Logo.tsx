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
    <div className={`inline-flex items-center ${className}`} style={{ lineHeight: '1' }}>
      {/* Simple H */}
      <div className={`${sizeClasses[size]} flex-shrink-0`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <svg
          viewBox="0 0 40 40"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          {/* Outer ring */}
          <circle cx="20" cy="20" r="18" stroke="#0f766e" strokeWidth="1.5" fill="none" />
          {/* Inner ring: left arc + right arc */}
          <path d="M15 8 A13 13 0 0 0 15 32" stroke="#0f766e" strokeWidth="1.5" fill="none" />
          <path d="M25 8 A13 13 0 0 1 25 32" stroke="#0f766e" strokeWidth="1.5" fill="none" />
          {/* H integrated with inner ring */}
          <path
            d="M15 8 V32 M25 8 V32 M15 20 H25"
            stroke="#0f766e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      <span className={`ml-2.5 ${size === 'sm' ? 'ml-2' : ''}`} style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: '1' }}>
        <span className={`${textSizeClasses[size]} font-bold text-gray-900`}>Helvenda</span>
        <span
          className={`ml-0.5 ${size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'} text-gray-500`}
        >
          .ch
        </span>
      </span>
    </div>
  )
}
