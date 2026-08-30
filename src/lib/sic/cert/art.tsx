/**
 * Vektor-Bausteine für das SIC-Zertifikat-PDF.
 * Alle Formen sind Svg-Primitiven von @react-pdf/renderer.
 */
import { Circle, G, Path, Rect, Svg, Text as SvgText, View } from '@react-pdf/renderer'
import React, { type ReactNode } from 'react'
import type { SicModuleId } from '@/lib/sic/modules'
import { CERT } from '@/lib/sic/cert/tokens'

const { color: C } = CERT

type SizeProps = { size?: number }

/** Schweizerkreuz-Wappen (Schild). */
export function CrestEmblem({ size = 36 }: SizeProps) {
  const h = size * 1.2
  return (
    <Svg width={size} height={h} viewBox="0 0 40 48">
      <Path
        d="M20 1 L36 6 L36 22 C36 34 28 42 20 47 C12 42 4 34 4 22 L4 6 Z"
        fill={C.red}
        stroke={C.gold}
        strokeWidth={1.2}
      />
      <Rect x={17} y={12} width={6} height={18} fill={C.white} />
      <Rect x={11} y={18} width={18} height={6} fill={C.white} />
    </Svg>
  )
}

/** Lorbeerkranz (zwei gespiegelte Blattbögen). */
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
      <G key={`l${i}`} transform={`translate(${lx},${ly}) scale(-1,1) rotate(${angle + 18})`}>
        <Path d="M0 0 C3.5 -5.5 9 -7.5 13 -3.5 C9 -1.5 4.5 0 0 0 Z" fill={C.gold} />
      </G>
    )
    leaves.push(
      <G key={`r${i}`} transform={`translate(${rx},${ry}) rotate(${-angle - 18})`}>
        <Path d="M0 0 C3.5 -5.5 9 -7.5 13 -3.5 C9 -1.5 4.5 0 0 0 Z" fill={C.gold} />
      </G>
    )
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      {leaves}
      <Path d="M28 60 Q36 66 44 60" stroke={C.goldLight} strokeWidth={1.2} fill="none" />
    </Svg>
  )
}

/**
 * Emblem: Wappen zentriert über dem Lorbeerkranz (View-Stack, keine verschachtelten Svg-Roots).
 */
export function CrestWithLaurel({ size = 78 }: SizeProps) {
  const crestW = size * 0.38
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <LaurelWreath size={size} />
      </View>
      <View style={{ marginTop: size * 0.02 }}>
        <CrestEmblem size={crestW} />
      </View>
    </View>
  )
}

/** Modul-Glyph pro SicModuleId. */
export function ModuleGlyph({
  moduleId,
  size = 22,
}: {
  moduleId?: SicModuleId | string
  size?: number
}) {
  const stroke = C.navy
  const fill = C.goldLight
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
          <Rect
            x={3}
            y={5}
            width={18}
            height={14}
            rx={1.5}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
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

/** Offizielles Siegel mit Punktkranz und SIC-Monogramm. */
export function Seal({ size = 64 }: SizeProps) {
  const dots: ReactNode[] = []
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2
    const x = 32 + Math.cos(a) * 28.5
    const y = 32 + Math.sin(a) * 28.5
    dots.push(<Circle key={i} cx={x} cy={y} r={0.85} fill={C.gold} />)
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={30} fill={C.ivory} stroke={C.gold} strokeWidth={1.4} />
      <Circle cx={32} cy={32} r={25.5} fill="none" stroke={C.navy} strokeWidth={0.7} />
      <Circle cx={32} cy={32} r={22} fill="none" stroke={C.gold} strokeWidth={0.9} />
      {dots}
      <SvgText
        x={32}
        y={28}
        textAnchor="middle"
        fill={C.gold}
        style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 }}
      >
        GEPRÜFT
      </SvgText>
      <SvgText
        x={32}
        y={38}
        textAnchor="middle"
        fill={C.navy}
        style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5 }}
      >
        SIC
      </SvgText>
      <SvgText
        x={32}
        y={46}
        textAnchor="middle"
        fill={C.gold}
        style={{ fontSize: 5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 }}
      >
        GEPRÜFT
      </SvgText>
    </Svg>
  )
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

/** Ecken-Ornament für den Urkundenrahmen. */
export function CornerFlourish({ corner, size = 28 }: { corner: Corner; size?: number }) {
  const transforms: Record<Corner, string> = {
    tl: 'translate(0,0)',
    tr: `translate(${size},0) scale(-1,1)`,
    bl: `translate(0,${size}) scale(1,-1)`,
    br: `translate(${size},${size}) scale(-1,-1)`,
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G transform={transforms[corner]}>
        <Path d="M2 18 L2 6 Q2 2 6 2 L18 2" stroke={C.gold} strokeWidth={1.1} fill="none" />
        <Path d="M5 14 L5 7 Q5 5 7 5 L14 5" stroke={C.navy} strokeWidth={0.7} fill="none" />
        <Circle cx={5} cy={5} r={1.3} fill={C.gold} />
      </G>
    </Svg>
  )
}

/** Feine Doppellinie (Gold + Navy) als Guilloche-Ersatz. */
export function GuillocheRule({ width = 200 }: { width?: number }) {
  return (
    <Svg width={width} height={6} viewBox={`0 0 ${width} 6`}>
      <Path d={`M0 2 H${width}`} stroke={C.gold} strokeWidth={0.9} />
      <Path d={`M0 4 H${width}`} stroke={C.navy} strokeWidth={0.45} />
    </Svg>
  )
}

/** Kleines Kalender-Glyph für Datumszeilen. */
export function CalendarMark({ size = 18 }: SizeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Rect x={2} y={3} width={14} height={13} rx={1.5} fill={C.navy} stroke={C.gold} strokeWidth={0.8} />
      <Rect x={2} y={3} width={14} height={4} fill={C.gold} />
      <Path d="M6 2 V5" stroke={C.goldLight} strokeWidth={1.2} />
      <Path d="M12 2 V5" stroke={C.goldLight} strokeWidth={1.2} />
      <Rect x={5} y={10} width={2} height={2} fill={C.goldPale} />
      <Rect x={8} y={10} width={2} height={2} fill={C.goldPale} />
      <Rect x={11} y={10} width={2} height={2} fill={C.goldPale} />
    </Svg>
  )
}
