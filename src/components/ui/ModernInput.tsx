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
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#C6C6C6]" />
        )}
        <input
          ref={ref}
          className={`w-full rounded-[16px] border border-[#C6C6C6] px-4 py-3 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#137A5F] ${showSearchIcon ? 'pl-12' : ''} ${className} `}
          {...props}
        />
      </div>
    )
  }
)

ModernInput.displayName = 'ModernInput'
