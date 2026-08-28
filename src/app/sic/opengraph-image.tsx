import { SIC_OG_ALT, SIC_OG_SIZE, SIC_OG_TYPE, sicOgImageResponse } from '@/lib/sic/og-image'

export const runtime = 'edge'

export const alt = SIC_OG_ALT
export const size = SIC_OG_SIZE
export const contentType = SIC_OG_TYPE

export default function SicOgImage() {
  return sicOgImageResponse()
}
