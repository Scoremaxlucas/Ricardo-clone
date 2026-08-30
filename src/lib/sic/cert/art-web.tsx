/**
 * HTML-SVG-Bausteine — dieselbe Urkundenoptik wie `art.tsx` (PDF / react-pdf).
 * Getrennte Datei, weil @react-pdf/renderer kein DOM-SVG rendert.
 */
import type { ReactNode } from 'react'
import type { SicModuleId } from '@/lib/sic/modules'
import { CERT } from '@/lib/sic/cert/tokens'

const { color: C } = CERT

type SizeProps = { size?: number }

export function CrestEmblem({ size = 36 }: SizeProps) {
  const h = size * 1.2
  return (
    <svg width={size} height={h} viewBox="0 0 40 48" aria-hidden="true">
      <path
        d="M20 1 L36 6 L36 22 C36 34 28 42 20 47 C12 42 4 34 4 22 L4 6 Z"
        fill={C.red}
        stroke={C.gold}
        strokeWidth={1.2}
      />
      <rect x={17} y={12} width={6} height={18} fill={C.white} />
      <rect x={11} y={18} width={18} height={6} fill={C.white} />
    </svg>
  )
}

export function LaurelWreath({ size = 72 }: SizeProps) {
  const leaves: ReactNode[] = []
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const angle = -75 + t * 150
    const rad = (angle * Math.PI) / 180
    const r = 30
    const lx = 36 + Math.sin(rad) * -r
    const ly = 38 + Math.cos(rad) * -r * 0.92
    const rx = 36 + Math.sin(rad) * r
    const ry = 38 + Math.cos(rad) * -r * 0.92
    leaves.push(
      <g key={`l${i}`} transform={`translate(${lx},${ly}) scale(-1,1) rotate(${angle + 18})`}>
        <path d="M0 0 C3.5 -5.5 9 -7.5 13 -3.5 C9 -1.5 4.5 0 0 0 Z" fill={C.gold} />
      </g>
    )
    leaves.push(
      <g key={`r${i}`} transform={`translate(${rx},${ry}) rotate(${-angle - 18})`}>
        <path d="M0 0 C3.5 -5.5 9 -7.5 13 -3.5 C9 -1.5 4.5 0 0 0 Z" fill={C.gold} />
      </g>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
      {leaves}
      <path d="M28 60 Q36 66 44 60" stroke={C.goldLight} strokeWidth={1.2} fill="none" />
    </svg>
  )
}

export function CrestWithLaurel({ size = 78 }: SizeProps) {
  const crestW = size * 0.38
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0">
        <LaurelWreath size={size} />
      </span>
      <span className="relative" style={{ marginTop: size * 0.02 }}>
        <CrestEmblem size={crestW} />
      </span>
    </span>
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
  const fill = C.goldLight
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
          <rect
            x={3}
            y={5}
            width={18}
            height={14}
            rx={1.5}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
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

export function Seal({ size = 64 }: SizeProps) {
  const dots: ReactNode[] = []
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2
    const x = 32 + Math.cos(a) * 28.5
    const y = 32 + Math.sin(a) * 28.5
    dots.push(<circle key={i} cx={x} cy={y} r={0.85} fill={C.gold} />)
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx={32} cy={32} r={30} fill={C.ivory} stroke={C.gold} strokeWidth={1.4} />
      <circle cx={32} cy={32} r={25.5} fill="none" stroke={C.navy} strokeWidth={0.7} />
      <circle cx={32} cy={32} r={22} fill="none" stroke={C.gold} strokeWidth={0.9} />
      {dots}
      <text
        x={32}
        y={28}
        textAnchor="middle"
        fill={C.gold}
        style={{ fontSize: 5.5, fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: 0.8 }}
      >
        GEPRÜFT
      </text>
      <text
        x={32}
        y={38}
        textAnchor="middle"
        fill={C.navy}
        style={{ fontSize: 13, fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: 1.5 }}
      >
        SIC
      </text>
      <text
        x={32}
        y={46}
        textAnchor="middle"
        fill={C.gold}
        style={{ fontSize: 5, fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 700, letterSpacing: 0.6 }}
      >
        GEPRÜFT
      </text>
    </svg>
  )
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

export function CornerFlourish({ corner, size = 28 }: { corner: Corner; size?: number }) {
  const transforms: Record<Corner, string> = {
    tl: 'translate(0,0)',
    tr: `translate(${size},0) scale(-1,1)`,
    bl: `translate(0,${size}) scale(1,-1)`,
    br: `translate(${size},${size}) scale(-1,-1)`,
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <g transform={transforms[corner]}>
        <path d="M2 18 L2 6 Q2 2 6 2 L18 2" stroke={C.gold} strokeWidth={1.1} fill="none" />
        <path d="M5 14 L5 7 Q5 5 7 5 L14 5" stroke={C.navy} strokeWidth={0.7} fill="none" />
        <circle cx={5} cy={5} r={1.3} fill={C.gold} />
      </g>
    </svg>
  )
}

export function GuillocheRule({ width = 200 }: { width?: number }) {
  return (
    <svg width={width} height={6} viewBox={`0 0 ${width} 6`} aria-hidden="true">
      <path d={`M0 2 H${width}`} stroke={C.gold} strokeWidth={0.9} />
      <path d={`M0 4 H${width}`} stroke={C.navy} strokeWidth={0.45} />
    </svg>
  )
}

export function CalendarMark({ size = 18 }: SizeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <rect x={2} y={3} width={14} height={13} rx={1.5} fill={C.navy} stroke={C.gold} strokeWidth={0.8} />
      <rect x={2} y={3} width={14} height={4} fill={C.gold} />
      <path d="M6 2 V5" stroke={C.goldLight} strokeWidth={1.2} />
      <path d="M12 2 V5" stroke={C.goldLight} strokeWidth={1.2} />
      <rect x={5} y={10} width={2} height={2} fill={C.goldPale} />
      <rect x={8} y={10} width={2} height={2} fill={C.goldPale} />
      <rect x={11} y={10} width={2} height={2} fill={C.goldPale} />
    </svg>
  )
}
