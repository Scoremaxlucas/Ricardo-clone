import { helvendaAppIconResponse, sicAppIconResponse } from '@/lib/sic/app-icon'
import { isSicSiteHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const h = await headers()
  if (isSicSiteHostFromHeaders(h) || h.get('x-sic-host') === '1') {
    return sicAppIconResponse(32)
  }
  return helvendaAppIconResponse(32)
}
