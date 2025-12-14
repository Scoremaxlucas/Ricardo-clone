'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary-50/50', className)}
      style={{
        background: 'linear-gradient(90deg, #f0fdfa 25%, #e6fffa 50%, #f0fdfa 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
      {...props}
    />
  )
}
