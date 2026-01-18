'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of skeleton (e.g., '100%', '200px') */
  width?: string | number
  /** Height of skeleton (e.g., '20px', '1rem') */
  height?: string | number
  /** Make skeleton circular */
  circle?: boolean
  /** Number of lines for text skeleton */
  lines?: number
  /** Animation variant */
  variant?: 'shimmer' | 'pulse' | 'wave'
}

/**
 * Skeleton Component - Accessible loading placeholder
 * 
 * @example
 * // Basic skeleton
 * <Skeleton className="h-4 w-full" />
 * 
 * // Text skeleton with multiple lines
 * <Skeleton lines={3} />
 * 
 * // Avatar skeleton
 * <Skeleton circle width={48} height={48} />
 */
export function Skeleton({ 
  className, 
  width,
  height,
  circle = false,
  lines,
  variant = 'shimmer',
  ...props 
}: SkeletonProps) {
  // If lines are specified, render multiple skeletons
  if (lines && lines > 1) {
    return (
      <div 
        className="space-y-2" 
        role="status" 
        aria-label="Wird geladen..."
        aria-busy="true"
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              // Last line is shorter for visual variety
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            variant={variant}
          />
        ))}
        <span className="sr-only">Wird geladen...</span>
      </div>
    )
  }

  const animations = {
    shimmer: {
      background: 'linear-gradient(90deg, #f0fdfa 25%, #e6fffa 50%, #f0fdfa 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
    },
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    wave: {
      background: 'linear-gradient(90deg, #f0fdfa 0%, #ccfbf1 50%, #f0fdfa 100%)',
      backgroundSize: '200% 100%',
      animation: 'wave 2s linear infinite',
    },
  }

  return (
    <div
      className={cn(
        'rounded-md bg-primary-50/50',
        circle && 'rounded-full',
        variant === 'pulse' && 'animate-pulse',
        className
      )}
      style={{
        width: width,
        height: height,
        ...(variant !== 'pulse' ? animations[variant] : {}),
      }}
      role="status"
      aria-label="Wird geladen..."
      aria-busy="true"
      {...props}
    >
      <span className="sr-only">Wird geladen...</span>
    </div>
  )
}

// ============================================
// PRE-BUILT SKELETON PATTERNS
// ============================================

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      {/* Image */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Brand */}
        <Skeleton className="h-4 w-1/2" />
        
        {/* Price */}
        <Skeleton className="h-6 w-1/3" />
        
        {/* Meta info */}
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

/**
 * Product Grid Skeleton
 */
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div 
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      role="status"
      aria-label={`${count} Produkte werden geladen...`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div 
      className="overflow-hidden rounded-lg border"
      role="status"
      aria-label="Tabelle wird geladen..."
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * User Profile Skeleton
 */
export function UserProfileSkeleton() {
  return (
    <div className="flex items-center gap-4" role="status" aria-label="Profil wird geladen...">
      {/* Avatar */}
      <Skeleton circle width={64} height={64} />
      
      {/* Info */}
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

/**
 * Order Card Skeleton
 */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Product */}
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

/**
 * Invoice Skeleton
 */
export function InvoiceSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  )
}

/**
 * Stats Card Skeleton
 */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-6 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/**
 * Full Page Loading Skeleton
 */
export function FullPageSkeleton({ title = 'Wird geladen...' }: { title?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton />
        
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Content */}
        <div className="rounded-lg border bg-white p-6">
          <Skeleton lines={6} />
        </div>
        
        {/* Screen reader */}
        <span className="sr-only" role="status" aria-live="polite">
          {title}
        </span>
      </div>
    </div>
  )
}
