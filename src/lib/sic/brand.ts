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

/** Akzentfarbe je Modul (Modul-Flyer-Referenz). */
export const SIC_MODULE_ACCENT: Record<SicModuleId, { hex: string; tw: string; ring: string; soft: string }> = {
  BONITAET: { hex: '#2f9e44', tw: 'bg-[#2f9e44]', ring: 'ring-[#2f9e44]/25', soft: 'bg-[#2f9e44]/10' },
  ARBEIT_EINKOMMEN: { hex: '#1d63c9', tw: 'bg-[#1d63c9]', ring: 'ring-[#1d63c9]/25', soft: 'bg-[#1d63c9]/10' },
  ZUVERLAESSIGKEIT: { hex: '#7b2d8e', tw: 'bg-[#7b2d8e]', ring: 'ring-[#7b2d8e]/25', soft: 'bg-[#7b2d8e]/10' },
  AUFENTHALT: { hex: '#e8791b', tw: 'bg-[#e8791b]', ring: 'ring-[#e8791b]/25', soft: 'bg-[#e8791b]/10' },
} as const
