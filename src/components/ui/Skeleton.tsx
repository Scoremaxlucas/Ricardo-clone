'use client'

import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

/**
 * Reusable skeleton/shimmer loading components
 */

type SkeletonProps = {
  className?: string
  /** Inline-Breite (px oder CSS), optional */
  width?: string | number
  /** Inline-Höhe (px oder CSS), optional */
  height?: string | number
  borderRadius?: string | number
  style?: CSSProperties
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '', width, height, borderRadius, style: styleProp }: SkeletonProps) {
  const style: CSSProperties = { ...styleProp }
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height
  if (borderRadius !== undefined) {
    style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
  }
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      style={Object.keys(style).length ? style : undefined}
      role="status"
      aria-label="Wird geladen"
    />
  )
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// Product grid skeleton (shows multiple cards)
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Profile/user card skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="flex flex-1 flex-col space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

// Page header skeleton (title + subtitle)
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 p-4">
      <Skeleton className="h-16 w-16 rounded-lg" />
      <div className="flex flex-1 flex-col space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

// Full page skeleton with header placeholder
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <PageHeaderSkeleton />
      {Array.from({ length: rows }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <ProductGridSkeleton count={12} />
    </div>
  )
}
