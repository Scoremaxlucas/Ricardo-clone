import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Swiss Immo Cert — Mieter-Zertifikat'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function SicOgImage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: '#c8102e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            +
          </div>
          <div style={{ color: 'white', fontSize: 68, fontWeight: 700, letterSpacing: 2 }}>Swiss Immo Cert</div>
        </div>
        <div style={{ color: '#d8b25a', fontSize: 30, marginTop: 20, letterSpacing: 6, textTransform: 'uppercase' }}>
          Mieter-Zertifikat
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 26, marginTop: 18 }}>
          Geprüft. Verifiziert. Vertrauenswürdig.
        </div>
      </div>
    ),
    { ...size }
  )
}
