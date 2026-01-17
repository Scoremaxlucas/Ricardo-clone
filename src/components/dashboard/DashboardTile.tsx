'use client'

import Link from 'next/link'
import { LucideIcon, ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

interface DashboardTileProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  count?: number | null
  badge?: ReactNode
  color?: string
  gradient?: string
  ariaLabel?: string
}

export function DashboardTile({
  title,
  description,
  icon: Icon,
  href,
  count,
  badge,
  color = 'text-primary-600',
  gradient = 'from-primary-500/10 to-primary-600/5',
  ariaLabel,
}: DashboardTileProps) {
  const hasNotification = count !== undefined && count !== null && count > 0

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={ariaLabel || `Zu ${title} navigieren`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Top Row: Icon and Badge */}
        <div className="mb-5 flex items-start justify-between">
          {/* Icon with modern styling */}
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm ring-1 ring-gray-100 transition-all duration-300 group-hover:shadow-md group-hover:ring-primary-100 ${color}`}>
            <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-2xl bg-primary-500/0 transition-all duration-300 group-hover:bg-primary-500/5" />
          </div>

          {/* Badge/Count with animation */}
          {badge || (hasNotification && (
            <span className="relative inline-flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-20" />
              <span className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30">
                {count}
              </span>
            </span>
          ))}
        </div>

        {/* Title with better typography */}
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-gray-900 transition-colors duration-200 group-hover:text-primary-700">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-4 flex-grow text-sm leading-relaxed text-gray-500">
          {description}
        </p>

        {/* Bottom action hint */}
        <div className="flex items-center text-sm font-medium text-primary-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span>Öffnen</span>
          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>

      {/* Bottom border accent on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  )
}
