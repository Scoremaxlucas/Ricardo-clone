import { ImageResponse } from 'next/og'
import { SIC_CERT_TAGLINE, SIC_COLORS, SIC_HOUSE_MARK } from '@/lib/sic/brand'
import { SIC_BRAND_NAME } from '@/lib/sic/config'

export const SIC_OG_SIZE = { width: 1200, height: 630 }
export const SIC_OG_ALT = `${SIC_BRAND_NAME} — Mieter-Zertifikat`
export const SIC_OG_TYPE = 'image/png'

function HouseMark({ size = 88 }: { size?: number }) {
  const M = SIC_HOUSE_MARK
  const stroke = SIC_COLORS.paper
  return (
    <svg width={size} height={size} viewBox={M.viewBox}>
      <path
        d={M.outline}
        stroke={stroke}
        strokeWidth={M.outlineStrokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x={M.square.x}
        y={M.square.y}
        width={M.square.width}
        height={M.square.height}
        rx={M.square.rx}
        fill={SIC_COLORS.red}
      />
      <rect
        x={M.crossV.x}
        y={M.crossV.y}
        width={M.crossV.width}
        height={M.crossV.height}
        rx={M.crossV.rx}
        fill="#ffffff"
      />
      <rect
        x={M.crossH.x}
        y={M.crossH.y}
        width={M.crossH.width}
        height={M.crossH.height}
        rx={M.crossH.rx}
        fill="#ffffff"
      />
    </svg>
  )
}

/** Teilen-Vorschau: Navy, Paper, Hausmarke, Wortmarke — wie das Zertifikat. */
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
            border: `1.5px solid ${C.navy}`,
            padding: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              background: C.paper,
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
              <HouseMark />
              <div
                style={{
                  display: 'flex',
                  marginTop: 18,
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: 0.4,
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
                <div style={{ width: 56, height: 1, background: C.gold }} />
                <div
                  style={{
                    color: C.goldLight,
                    fontSize: 18,
                    letterSpacing: 6,
                    fontWeight: 600,
                    marginLeft: 16,
                    marginRight: 16,
                  }}
                >
                  MIETER-ZERTIFIKAT
                </div>
                <div style={{ width: 56, height: 1, background: C.gold }} />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: C.navy,
                fontSize: 26,
                letterSpacing: 0.3,
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
