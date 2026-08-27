/**
 * Swiss Immo Cert — visuelle Marken-Tokens.
 *
 * Diese Werte spiegeln die `sic`-Farbrollen aus `tailwind.config.js`. Sie
 * existieren hier für Stellen, an die Tailwind nicht reicht: das PDF
 * (@react-pdf), OG-Bilder, E-Mail-HTML und Inline-Styles. Beide Listen müssen
 * übereinstimmen.
 *
 * Jede Farbe hat genau eine Aufgabe:
 * - Navy: Text, Header, Flächen — das Fundament.
 * - Teal: alles, worauf man klickt. Nichts sonst.
 * - Rot: Marke (Schweizerkreuz, «Immo») und Warnsignal. Keine Kaufknöpfe.
 * - Gold: das Zertifikat selbst — Rahmen, Siegel, Urkundenoptik.
 * - Grün: «geprüft». Kein anderer Zweck.
 */

import type { SicModuleId } from '@/lib/sic/modules'

export const SIC_COLORS = {
  navy: '#0f2b5e',
  navyDeep: '#0a1f45',
  navySoft: '#1c3d78',
  /** Handlungsfarbe: primäre Knöpfe. Dunkel genug für weissen Text. */
  action: '#0e7c6b',
  actionDeep: '#0a6357',
  actionBg: '#e7f4f1',
  /** Nur Wortmarke und Schweizerkreuz. */
  red: '#c8102e',
  /** Nur Zertifikat: Rahmen, Siegel. */
  gold: '#b8912f',
  /** Gold für Text — der helle Ton erreicht auf Elfenbein den Kontrast nicht. */
  goldText: '#8a6a1d',
  goldLight: '#d8b25a',
  paper: '#fbf9f3',
  paperSoft: '#f7f3ea',
  hairline: '#e7ddc4',
  green: '#2f9e44',
  greenDeep: '#1f7a34',
} as const

export const SIC_TAGLINE = 'Das geprüfte Schweizer Mieter-Zertifikat'
export const SIC_CERT_TAGLINE = 'Geprüft. Verifiziert. Vertrauenswürdig.'

/**
 * Hero-Hintergrund. Bis ein eigenes Wohnungsfoto liegt, nutzen wir die
 * vorhandene Alpen-Aufnahme — warm und schweizerisch, ohne Stock-Handschlag.
 * Eigenes Motiv: `public/sic/hero-wohnung.jpg` und diesen Pfad umstellen.
 */
export const SIC_HERO_IMAGE = '/sic/cert/backdrop-alps.png'

/**
 * Akzentfarbe je Modul — bewusst für alle vier gleich (Navy).
 * Unterschieden werden die Module über Icon und Titel, nicht über Farbe.
 */
export const SIC_MODULE_ACCENT: Record<SicModuleId, { hex: string; tw: string; ring: string; soft: string }> = {
  BONITAET: { hex: SIC_COLORS.navy, tw: 'bg-sic-navy', ring: 'ring-sic-navy/25', soft: 'bg-sic-navy/10' },
  ARBEIT_EINKOMMEN: { hex: SIC_COLORS.navy, tw: 'bg-sic-navy', ring: 'ring-sic-navy/25', soft: 'bg-sic-navy/10' },
  ZUVERLAESSIGKEIT: { hex: SIC_COLORS.navy, tw: 'bg-sic-navy', ring: 'ring-sic-navy/25', soft: 'bg-sic-navy/10' },
  AUFENTHALT: { hex: SIC_COLORS.navy, tw: 'bg-sic-navy', ring: 'ring-sic-navy/25', soft: 'bg-sic-navy/10' },
} as const
