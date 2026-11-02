/**
 * HTML-SVG-Bausteine — dieselbe Optik wie `art.tsx` (PDF / react-pdf).
 * Getrennte Datei, weil @react-pdf/renderer kein DOM-SVG rendert.
 */
import type { SicModuleId } from '@/lib/sic/modules'
import { SIC_HOUSE_MARK, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
import { CERT } from '@/lib/sic/cert/tokens'

const { color: C } = CERT
const M = SIC_HOUSE_MARK

type SizeProps = { size?: number }

export function HouseMark({ size = 40, onDark = true }: SizeProps & { onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={M.viewBox} aria-hidden="true">
      <path
        d={M.outline}
        stroke={sicLogoMarkHouseStroke(onDark)}
        strokeWidth={M.outlineStrokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <rect {...M.square} fill={C.red} />
      <rect {...M.crossV} fill={C.white} />
      <rect {...M.crossH} fill={C.white} />
    </svg>
  )
}

export function ModuleGlyph({
  moduleId,
  size = 22,
}: {
  moduleId?: SicModuleId | string
  size?: number
}) {
  const stroke = C.navy
  const fill = C.ivory
  const common = { width: size, height: size, viewBox: '0 0 24 24' as const, 'aria-hidden': true as const }

  switch (moduleId) {
    case 'BONITAET':
      return (
        <svg {...common}>
          <path
            d="M12 2 L19 5 L19 11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 L5 5 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
          <path d="M8.5 12 L11 14.5 L16 9" stroke={C.navy} strokeWidth={1.6} fill="none" />
        </svg>
      )
    case 'ARBEIT_EINKOMMEN':
      return (
        <svg {...common}>
          <path d="M4 9 H20 V19 H4 Z" fill={fill} stroke={stroke} strokeWidth={1.2} />
          <path d="M9 9 V7 H15 V9" stroke={stroke} strokeWidth={1.2} fill="none" />
          <rect x={10} y={12} width={4} height={3} fill={C.navy} />
        </svg>
      )
    case 'ZUVERLAESSIGKEIT':
      return (
        <svg {...common}>
          <path d="M4 11 L12 5 L20 11 V19 H4 Z" fill={fill} stroke={stroke} strokeWidth={1.2} />
          <rect x={10} y={13} width={4} height={6} fill={C.navy} />
          <circle cx={17.5} cy={14.5} r={2.2} fill="none" stroke={C.navy} strokeWidth={1.1} />
          <path d="M17.5 16.7 V19" stroke={C.navy} strokeWidth={1.1} />
        </svg>
      )
    case 'AUFENTHALT':
      return (
        <svg {...common}>
          <rect x={3} y={5} width={18} height={14} rx={1.5} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <circle cx={9} cy={11} r={2.5} fill={C.navy} />
          <path d="M13 9 H19" stroke={C.navy} strokeWidth={1.2} />
          <path d="M13 12 H17" stroke={C.navy} strokeWidth={1.2} />
          <path d="M13 15 H18" stroke={C.navy} strokeWidth={1.2} />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx={12} cy={12} r={8} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <path d="M8.5 12.5 L11 15 L15.5 9.5" stroke={C.navy} strokeWidth={1.5} fill="none" />
        </svg>
      )
  }
}

export function DocumentRule({ width = 200 }: { width?: number }) {
  return (
    <svg width={width} height={2} viewBox={`0 0 ${width} 2`} aria-hidden="true">
      <path d={`M0 1 H${width}`} stroke={C.navy} strokeWidth={0.7} />
    </svg>
  )
}


/**
 * Siegel wie im PDF (`art.tsx`): zwei Goldringe, Hausmarke, «GEPRÜFT».
 * Inline-Styles: Tailwind scannt `src/lib` nicht.
 */
export function CertSeal({ size = 74, year }: { size?: number; year: string }) {
  const r = size / 2
  const k = size / 74
  const line = (fontSize: number, color: string, letterSpacing: number, bold = true) => ({
    display: 'block',
    marginTop: 2 * k,
    fontSize: fontSize * k,
    lineHeight: 1,
    fontWeight: bold ? 700 : 400,
    letterSpacing: letterSpacing * k,
    color,
    whiteSpace: 'nowrap' as const,
  })
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0 }}
      >
        <circle cx={r} cy={r} r={r - 1} fill={C.ivorySoft} stroke={C.gold} strokeWidth={1.4} />
        <circle cx={r} cy={r} r={r - 5} fill="none" stroke={C.gold} strokeWidth={0.5} />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HouseMark size={Math.round(size * 0.24)} onDark={false} />
        <span style={line(8.5, C.navy, 1.5)}>GEPRÜFT</span>
        <span style={line(4.1, C.goldText, 0.15)}>BETREIBUNG · AUSWEIS</span>
        <span style={line(5.5, C.muted, 0.6, false)}>{year}</span>
      </div>
    </div>
  )
}
