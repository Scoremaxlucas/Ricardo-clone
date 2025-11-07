import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {/* Watch Icon */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Watch Case */}
          <rect
            x="8"
            y="12"
            width="24"
            height="16"
            rx="3"
            stroke="#64748b"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Watch Face */}
          <circle
            cx="20"
            cy="20"
            r="8"
            stroke="#64748b"
            strokeWidth="1.5"
            fill="none"
          />
          
          {/* Hour Markers */}
          <circle cx="20" cy="12" r="1" fill="#64748b" />
          <circle cx="28" cy="20" r="1" fill="#64748b" />
          <circle cx="20" cy="28" r="1" fill="#64748b" />
          <circle cx="12" cy="20" r="1" fill="#64748b" />
          
          {/* Crown */}
          <rect
            x="22"
            y="8"
            width="2"
            height="4"
            rx="1"
            fill="#64748b"
          />
          
          {/* Bracelet */}
          <rect x="6" y="16" width="4" height="8" rx="1" fill="#64748b" />
          <rect x="30" y="16" width="4" height="8" rx="1" fill="#64748b" />
        </svg>
      </div>
      
      {/* Text */}
      <div className="ml-2">
        <div className="flex items-center">
          <span className="text-xl font-bold text-gray-900">watch-</span>
          <div className="bg-blue-600 px-2 py-1 rounded">
            <span className="text-yellow-400 font-bold text-sm">OUT.CH</span>
          </div>
        </div>
      </div>
    </div>
  )
}

