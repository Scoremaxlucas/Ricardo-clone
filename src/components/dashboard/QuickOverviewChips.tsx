'use client'

import { ReactNode } from 'react'
import { TrendingUp, Activity } from 'lucide-react'

interface QuickOverviewChipsProps {
  children: ReactNode
}

export function QuickOverviewChips({ children }: QuickOverviewChipsProps) {
  return (
    <div className="mb-8 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Übersicht</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
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
  // If value is empty string, render label only (for custom formatted labels)
  if (value === '' || value === 0 || value === '0' || value === '—') {
    if (value === '') {
      // Empty value means label contains everything
      return (
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
            highlight
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 ring-1 ring-amber-200/50 shadow-sm shadow-amber-100'
              : 'bg-white text-gray-600 ring-1 ring-gray-200/50 shadow-sm'
          }`}
        >
          <span>{label}</span>
        </div>
      )
    }
    return null // Don't render if zero
  }

  return (
    <div
      className={`group inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
        highlight
          ? 'bg-gradient-to-r from-primary-50 to-teal-50 text-primary-700 ring-1 ring-primary-200/50 shadow-sm shadow-primary-100'
          : 'bg-white text-gray-700 ring-1 ring-gray-200/50 shadow-sm hover:ring-primary-200/50'
      }`}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${
        highlight
          ? 'bg-primary-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 group-hover:bg-primary-100 group-hover:text-primary-700'
      }`}>
        {value}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  )
}
