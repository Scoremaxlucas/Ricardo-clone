'use client'

import { Skeleton } from './Skeleton'

interface ArticleSkeletonProps {
  count?: number
  variant?: 'grid' | 'list'
}

export function ArticleSkeleton({ count = 6, variant = 'grid' }: ArticleSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <Skeleton className="h-24 w-24 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Skeleton className="aspect-[5/4] w-full" />
          <div className="p-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

