'use client'

import { AuthHeader } from '@/components/layout/AuthHeader'
import { AuthSurfaceProvider } from '@/contexts/AuthSurfaceContext'
import { cn } from '@/lib/utils'

export function AuthLayoutClient({
  isWohnen,
  children,
}: {
  isWohnen: boolean
  children: React.ReactNode
}) {
  return (
    <AuthSurfaceProvider value={isWohnen}>
      <div
        className={cn(
          'flex min-h-screen flex-col',
          isWohnen ? 'bg-gradient-to-b from-[#eef9f4] via-[#f5fdfb] to-slate-100' : 'bg-gray-50'
        )}
      >
        <AuthHeader isWohnen={isWohnen} />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AuthSurfaceProvider>
  )
}
