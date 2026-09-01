import { helvendaAppIconResponse, sicAppIconResponse } from '@/lib/sic/app-icon'
import { isSicSiteHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const h = await headers()
  if (isSicSiteHostFromHeaders(h) || h.get('x-sic-host') === '1') {
    return sicAppIconResponse(180)
  }
  return helvendaAppIconResponse(180)
}
