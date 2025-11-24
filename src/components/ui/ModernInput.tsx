'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { Search } from 'lucide-react'

interface ModernInputProps extends InputHTMLAttributes<HTMLInputElement> {
  showSearchIcon?: boolean
  className?: string
}

export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({ showSearchIcon = false, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {showSearchIcon && (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C6C6C6]" />
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 border border-[#C6C6C6] rounded-[16px]
            focus:outline-none focus:ring-2 focus:ring-[#137A5F] focus:border-transparent
            transition-all duration-200
            ${showSearchIcon ? 'pl-12' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
    )
  }
)

ModernInput.displayName = 'ModernInput'














