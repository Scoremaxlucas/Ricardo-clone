'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface CategoryTileProps {
  href: string
  icon: ReactNode | string
  label: string
  className?: string
}

export function CategoryTile({ href, icon, label, className = '' }: CategoryTileProps) {
  return (
    <Link
      href={href}
      className={`
        w-[100px] h-[100px] bg-white rounded-[16px] border border-[#F4F4F4]
        flex flex-col items-center justify-center gap-2
        hover:shadow-lg transition-all duration-200 cursor-pointer
        group
        ${className}
      `}
    >
      <div className="text-[40px] group-hover:scale-110 transition-transform duration-200">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>
      <span className="text-[14px] font-medium text-[#3A3A3A] text-center px-2">
        {label}
      </span>
    </Link>
  )
}














