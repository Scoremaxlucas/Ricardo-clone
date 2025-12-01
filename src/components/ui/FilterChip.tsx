'use client'

import { ButtonHTMLAttributes } from 'react'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: React.ReactNode
}

export function FilterChip({
  active = false,
  children,
  className = '',
  ...props
}: FilterChipProps) {
  return (
    <button
      className={`rounded-[50px] px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'border border-[#137A5F] bg-[#137A5F] text-white hover:bg-[#0f5f4a]'
          : 'border border-[#C6C6C6] bg-white text-[#3A3A3A] hover:bg-[#F4F4F4]'
      } ${className} `}
      {...props}
    >
      {children}
    </button>
  )
}
