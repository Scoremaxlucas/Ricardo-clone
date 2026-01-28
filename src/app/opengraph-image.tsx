import { ImageResponse } from 'next/og'

export const alt = 'Helvenda – Schweizer Online-Marktplatz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          Helvenda
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 28,
            marginTop: 12,
          }}
        >
          Der Schweizer Online-Marktplatz
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 20,
            marginTop: 8,
          }}
        >
          Kaufen & verkaufen – einfach und sicher
        </div>
      </div>
    ),
    { ...size }
  )
}
