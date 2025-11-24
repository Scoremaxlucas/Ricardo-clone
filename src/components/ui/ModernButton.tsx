'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

export function ModernButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ModernButtonProps) {
  const baseStyles = 'font-medium transition-all duration-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-[#137A5F] hover:bg-[#0f5f4a] text-white shadow-sm hover:shadow-md focus:ring-[#137A5F]',
    secondary: 'bg-white hover:bg-[#F4F4F4] text-[#3A3A3A] border border-[#C6C6C6] focus:ring-[#137A5F]',
  }
  
  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}














