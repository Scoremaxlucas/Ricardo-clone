/**
 * Vektor-Bausteine für das SIC-Zertifikat-PDF.
 * Hausmarke — nicht Bundeswappen. Kein Lorbeer, kein Gummistempel.
 */
import { Circle, Path, Rect, Svg, View } from '@react-pdf/renderer'
import React from 'react'
import { SIC_HOUSE_MARK, sicLogoMarkHouseStroke } from '@/lib/sic/brand'
import type { SicModuleId } from '@/lib/sic/modules'
import { CERT } from '@/lib/sic/cert/tokens'

const { color: C } = CERT
const M = SIC_HOUSE_MARK

type SizeProps = { size?: number }

/** Dieselbe Hausmarke wie auf der Website. */
export function HouseMark({ size = 40, onDark = true }: SizeProps & { onDark?: boolean }) {
  const stroke = sicLogoMarkHouseStroke(onDark)
  return (
    <Svg width={size} height={size} viewBox={M.viewBox}>
      <Path
        d={M.outline}
        stroke={stroke}
        strokeWidth={M.outlineStrokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <Rect
        x={M.square.x}
        y={M.square.y}
        width={M.square.width}
        height={M.square.height}
        rx={M.square.rx}
        fill={C.red}
      />
      <Rect
        x={M.crossV.x}
        y={M.crossV.y}
        width={M.crossV.width}
        height={M.crossV.height}
        rx={M.crossV.rx}
        fill={C.white}
      />
      <Rect
        x={M.crossH.x}
        y={M.crossH.y}
        width={M.crossH.width}
        height={M.crossH.height}
        rx={M.crossH.rx}
        fill={C.white}
      />
    </Svg>
  )
}

/** Modul-Glyph pro SicModuleId — Navy auf Elfenbein, kein Goldschmuck. */
export function ModuleGlyph({
  moduleId,
  size = 22,
}: {
  moduleId?: SicModuleId | string
  size?: number
}) {
  const stroke = C.navy
  const fill = C.ivory
  const common = { width: size, height: size, viewBox: '0 0 24 24' as const }

  switch (moduleId) {
    case 'BONITAET':
      return (
        <Svg {...common}>
          <Path
            d="M12 2 L19 5 L19 11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 L5 5 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
          <Path d="M8.5 12 L11 14.5 L16 9" stroke={C.navy} strokeWidth={1.6} fill="none" />
        </Svg>
      )
    case 'ARBEIT_EINKOMMEN':
      return (
        <Svg {...common}>
          <Path d="M4 9 H20 V19 H4 Z" fill={fill} stroke={stroke} strokeWidth={1.2} />
          <Path d="M9 9 V7 H15 V9" stroke={stroke} strokeWidth={1.2} fill="none" />
          <Rect x={10} y={12} width={4} height={3} fill={C.navy} />
        </Svg>
      )
    case 'ZUVERLAESSIGKEIT':
      return (
        <Svg {...common}>
          <Path d="M4 11 L12 5 L20 11 V19 H4 Z" fill={fill} stroke={stroke} strokeWidth={1.2} />
          <Rect x={10} y={13} width={4} height={6} fill={C.navy} />
          <Circle cx={17.5} cy={14.5} r={2.2} fill="none" stroke={C.navy} strokeWidth={1.1} />
          <Path d="M17.5 16.7 V19" stroke={C.navy} strokeWidth={1.1} />
        </Svg>
      )
    case 'AUFENTHALT':
      return (
        <Svg {...common}>
          <Rect x={3} y={5} width={18} height={14} rx={1.5} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <Circle cx={9} cy={11} r={2.5} fill={C.navy} />
          <Path d="M13 9 H19" stroke={C.navy} strokeWidth={1.2} />
          <Path d="M13 12 H17" stroke={C.navy} strokeWidth={1.2} />
          <Path d="M13 15 H18" stroke={C.navy} strokeWidth={1.2} />
        </Svg>
      )
    default:
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <Path d="M8.5 12.5 L11 15 L15.5 9.5" stroke={C.navy} strokeWidth={1.5} fill="none" />
        </Svg>
      )
  }
}

/** Haarlinie unter dem Namen — ein Strich, kein Guilloche. */
export function DocumentRule({ width = 200 }: { width?: number }) {
  return (
    <Svg width={width} height={2} viewBox={`0 0 ${width} 2`}>
      <Path d={`M0 1 H${width}`} stroke={C.navy} strokeWidth={0.7} />
    </Svg>
  )
}

