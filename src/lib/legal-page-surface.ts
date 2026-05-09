import { isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'
import { headers } from 'next/headers'

export type LegalPageSurface = 'default' | 'wohnen'

export function legalSurfaceFromHeaders(): LegalPageSurface {
  return isWohnenMatchingHostFromHeaders(headers()) ? 'wohnen' : 'default'
}

export function legalMainBgClass(surface: LegalPageSurface): string {
  return surface === 'wohnen' ? 'min-h-screen bg-[#f5fdfb]' : 'min-h-screen bg-gray-50'
}
