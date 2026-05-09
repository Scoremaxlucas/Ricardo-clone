/**
 * Auth Layout - Minimal layout for authentication pages
 *
 * Provides:
 * - Minimal header (logo + optional back link)
 * - Centered auth card content
 * - Consistent background + spacing (Wohnen: teal-tinted surface)
 * - No footer
 *
 * Used for: /login, /register, /forgot-password, /reset-password
 */

import { isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'
import { AuthLayoutClient } from './AuthLayoutClient'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isWohnen = isWohnenMatchingHostFromHeaders(headers())
  return <AuthLayoutClient isWohnen={isWohnen}>{children}</AuthLayoutClient>
}
