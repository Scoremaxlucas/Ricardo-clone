'use client'

import { ReactNode } from 'react'

interface QuickOverviewChipsProps {
  children: ReactNode
}

export function QuickOverviewChips({ children }: QuickOverviewChipsProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">{children}</div>
  )
}

interface QuickOverviewChipProps {
  label: string
  value: string | number
  highlight?: boolean
}

export function QuickOverviewChip({
  label,
  value,
  highlight = false,
}: QuickOverviewChipProps) {
  if (value === 0 || value === '0' || value === '—') {
    return null // Don't render if zero
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        highlight
          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  )
}
