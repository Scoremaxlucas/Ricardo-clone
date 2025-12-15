/**
 * Auth Layout - Minimal layout for authentication pages
 * 
 * Provides:
 * - Minimal header (logo + optional back link)
 * - Centered auth card content
 * - Consistent background + spacing
 * - No footer
 * 
 * Used for: /login, /register, /forgot-password, /reset-password
 */

import { AuthHeader } from '@/components/layout/AuthHeader'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
