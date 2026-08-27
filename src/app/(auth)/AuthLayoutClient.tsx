'use client'

import { AuthHeader } from '@/components/layout/AuthHeader'
import { AuthSurfaceProvider } from '@/contexts/AuthSurfaceContext'
import { cn } from '@/lib/utils'

export function AuthLayoutClient({
  isSic,
  children,
}: {
  isSic: boolean
  children: React.ReactNode
}) {
  return (
    <AuthSurfaceProvider value={isSic}>
      <div
        className={cn(
          'flex min-h-screen flex-col',
          isSic ? 'bg-[#fbf9f3]' : 'bg-gray-50'
        )}
      >
        <AuthHeader isSic={isSic} />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AuthSurfaceProvider>
  )
}
