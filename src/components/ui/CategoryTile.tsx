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
      className={`group flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-[#F4F4F4] bg-white transition-all duration-200 hover:shadow-lg ${className} `}
    >
      <div className="text-[40px] transition-transform duration-200 group-hover:scale-110">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>
      <span className="px-2 text-center text-[14px] font-medium text-[#3A3A3A]">{label}</span>
    </Link>
  )
}
