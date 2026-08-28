import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { isSicProductionHostname } from '@/lib/sic/config'
import { SIC_OG_ALT, SIC_OG_SIZE, SIC_OG_TYPE, sicOgImageResponse } from '@/lib/sic/og-image'

export const runtime = 'edge'

export const alt = SIC_OG_ALT
export const size = SIC_OG_SIZE
export const contentType = SIC_OG_TYPE

export default async function OgImage() {
  const host = (await headers()).get('host') || ''
  const sic = isSicProductionHostname(host)

  if (sic) {
    return sicOgImageResponse()
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f766e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{ color: 'white', fontSize: 64, fontWeight: 'bold' }}>Helvenda</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 32, marginTop: 16 }}>
          Der Schweizer Online-Marktplatz
        </div>
      </div>
    ),
    { ...size }
  )
}
