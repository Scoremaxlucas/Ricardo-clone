/**
 * Swiss Immo Cert — visuelle Marken-Tokens.
 *
 * Single Source of Truth für Farben, Slogan und Modul-Akzentfarben.
 * Referenz: offizielle SIC-Marketingunterlagen (USP-Übersicht, Modul-Flyer,
 * Zertifikat). Palette: tiefes Navy, Schweizer Rot, Gold (Zertifikat), Grün
 * für «VERIFIZIERT».
 */

import type { SicModuleId } from '@/lib/sic/modules'

export const SIC_COLORS = {
  /** Primäres Navy (Wortmarke, Headers, Flächen). */
  navy: '#0f2b5e',
  /** Tieferes Navy für Verläufe/Footer. */
  navyDeep: '#0a1f45',
  /** Helles Navy für Icons/Sekundärflächen. */
  navySoft: '#1c3d78',
  /** Schweizer Rot (Kreuz, «Immo»). */
  red: '#c8102e',
  /** Gold/Bronze (Zertifikat-Rahmen, Siegel). */
  gold: '#b8912f',
  goldLight: '#d8b25a',
  /** Grün für Verifizierungs-Häkchen/Bestätigungen. */
  green: '#2f9e44',
  greenDeep: '#1f7a34',
} as const

export const SIC_TAGLINE = 'Der Fast Track zur Wunschwohnung'
export const SIC_CERT_TAGLINE = 'Geprüft. Verifiziert. Vertrauenswürdig.'

/**
 * Akzentfarbe je Modul — bewusst für alle vier gleich (Navy).
 * Vier verschiedene Buntfarben liessen die Auswahl wie ein Baukasten aussehen
 * und erhöhten die visuelle Last; unterschieden werden die Module über Icon und
 * Titel, nicht über Farbe.
 */
export const SIC_MODULE_ACCENT: Record<SicModuleId, { hex: string; tw: string; ring: string; soft: string }> = {
  BONITAET: { hex: SIC_COLORS.navy, tw: 'bg-[#0f2b5e]', ring: 'ring-[#0f2b5e]/25', soft: 'bg-[#0f2b5e]/10' },
  ARBEIT_EINKOMMEN: { hex: SIC_COLORS.navy, tw: 'bg-[#0f2b5e]', ring: 'ring-[#0f2b5e]/25', soft: 'bg-[#0f2b5e]/10' },
  ZUVERLAESSIGKEIT: { hex: SIC_COLORS.navy, tw: 'bg-[#0f2b5e]', ring: 'ring-[#0f2b5e]/25', soft: 'bg-[#0f2b5e]/10' },
  AUFENTHALT: { hex: SIC_COLORS.navy, tw: 'bg-[#0f2b5e]', ring: 'ring-[#0f2b5e]/25', soft: 'bg-[#0f2b5e]/10' },
} as const
