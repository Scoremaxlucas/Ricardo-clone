import { ImageResponse } from 'next/og'
import { SIC_CERT_TAGLINE, SIC_COLORS } from '@/lib/sic/brand'
import { SIC_BRAND_NAME } from '@/lib/sic/config'

export const SIC_OG_SIZE = { width: 1200, height: 630 }
export const SIC_OG_ALT = `${SIC_BRAND_NAME} — Mieter-Zertifikat`
export const SIC_OG_TYPE = 'image/png'

/** Wappen vom Zertifikat-PDF — nicht das rote Plus-Quadrat. */
function CrestMark({ size = 88 }: { size?: number }) {
  const h = Math.round(size * 1.2)
  return (
    <svg width={size} height={h} viewBox="0 0 40 48">
      <path
        d="M20 1 L36 6 L36 22 C36 34 28 42 20 47 C12 42 4 34 4 22 L4 6 Z"
        fill={SIC_COLORS.red}
        stroke={SIC_COLORS.gold}
        strokeWidth={1.2}
      />
      <rect x={17} y={12} width={6} height={18} fill="#ffffff" />
      <rect x={11} y={18} width={18} height={6} fill="#ffffff" />
    </svg>
  )
}

/** Teilen-Vorschau: Navy, Paper, Wortmarke, Mieter-Zertifikat — wie die Urkunde. */
export function sicOgImageResponse(): ImageResponse {
  const C = SIC_COLORS
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: C.navyDeep,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 1048,
            height: 518,
            background: C.navy,
            border: `3px solid ${C.gold}`,
            padding: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              background: C.paper,
              border: `1px solid ${C.gold}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                background: C.navy,
                alignItems: 'center',
                paddingTop: 44,
                paddingBottom: 40,
              }}
            >
              <CrestMark />
              <div
                style={{
                  display: 'flex',
                  marginTop: 18,
                  fontSize: 54,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: 1,
                }}
              >
                <span>Swiss </span>
                <span style={{ color: C.red }}>Immo</span>
                <span> Cert</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: 20,
                }}
              >
                <div style={{ width: 72, height: 2, background: C.gold }} />
                <div
                  style={{
                    color: C.goldLight,
                    fontSize: 20,
                    letterSpacing: 7,
                    fontWeight: 600,
                    marginLeft: 18,
                    marginRight: 18,
                  }}
                >
                  MIETER-ZERTIFIKAT
                </div>
                <div style={{ width: 72, height: 2, background: C.gold }} />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: C.navy,
                fontSize: 28,
                letterSpacing: 0.4,
              }}
            >
              {SIC_CERT_TAGLINE}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SIC_OG_SIZE }
  )
}
