import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Helvenda Wohnungen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#18a87c',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{ color: 'white', fontSize: 64, fontWeight: 'bold' }}>Helvenda Wohnungen</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 32, marginTop: 16 }}>
          Fair mieten und vermieten in der Schweiz
        </div>
      </div>
    ),
    { ...size }
  )
}
