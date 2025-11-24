'use client'

import { ButtonHTMLAttributes } from 'react'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: React.ReactNode
}

export function FilterChip({ active = false, children, className = '', ...props }: FilterChipProps) {
  return (
    <button
      className={`
        px-4 py-2 rounded-[50px] text-sm font-medium transition-all duration-200
        ${active 
          ? 'bg-[#137A5F] text-white border border-[#137A5F] hover:bg-[#0f5f4a]' 
          : 'bg-white text-[#3A3A3A] border border-[#C6C6C6] hover:bg-[#F4F4F4]'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}














