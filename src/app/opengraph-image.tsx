import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { isSicProductionHostname } from '@/lib/sic/config'

export const runtime = 'edge'

export const alt = 'Swiss Immo Cert'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  const host = (await headers()).get('host') || ''
  const sic = isSicProductionHostname(host)

  if (sic) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0a1f45 0%, #0f2b5e 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ color: 'white', fontSize: 64, fontWeight: 700 }}>Swiss Immo Cert</div>
          <div style={{ color: '#d8b25a', fontSize: 28, marginTop: 16 }}>Das geprüfte Schweizer Mieter-Zertifikat</div>
        </div>
      ),
      { ...size }
    )
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
