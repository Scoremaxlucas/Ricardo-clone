'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface DashboardTileProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  count?: number | null
  badge?: ReactNode
  color?: string
  ariaLabel?: string
}

export function DashboardTile({
  title,
  description,
  icon: Icon,
  href,
  count,
  badge,
  color = 'bg-gray-100 text-gray-600',
  ariaLabel,
}: DashboardTileProps) {
  const displayCount = count !== undefined && count !== null ? count : '—'

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={ariaLabel || `Zu ${title} navigieren`}
    >
      {/* Icon and Badge/Count */}
      <div className="mb-4 flex items-start justify-between">
        <div className={`inline-flex rounded-lg p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        {badge || (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              count && count > 0
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {displayCount}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
