/**
 * Auth Layout — minimal chrome for login / password flows.
 * On swissimmocert.ch: Swiss Immo Cert branding. Otherwise Helvenda marketplace.
 */

import { isSicSiteHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'
import { AuthLayoutClient } from './AuthLayoutClient'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isSic = isSicSiteHostFromHeaders(headers())
  return <AuthLayoutClient isSic={isSic}>{children}</AuthLayoutClient>
}
