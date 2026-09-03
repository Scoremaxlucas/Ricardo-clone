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
 * - Gold: sparsam auf dem Zertifikat — eine Linie unter «Mieter-Zertifikat».
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

/** Haus-Umriss der Marke: auf Paper Navy, auf Navy Paper — sonst bleibt nur das Kreuz. */
export function sicLogoMarkHouseStroke(onDark: boolean): string {
  return onDark ? SIC_COLORS.paper : SIC_COLORS.navy
}

/**
 * Dieselbe Hausmarke auf Logo, Zertifikat-PDF, Prüfseite und OG.
 * Kein Bundeswappen — das Kreuz sitzt im Haus, nicht im Schild.
 */
export const SIC_HOUSE_MARK = {
  viewBox: '0 0 48 48',
  outline: 'M8 21.5 24 8l16 13.5V41a1.5 1.5 0 0 1-1.5 1.5h-29A1.5 1.5 0 0 1 8 41z',
  outlineStrokeWidth: 3,
  square: { x: 16, y: 20, width: 16, height: 16, rx: 3 },
  crossV: { x: 23, y: 23.5, width: 2.5, height: 9, rx: 1 },
  crossH: { x: 19.75, y: 26.75, width: 9, height: 2.5, rx: 1 },
} as const

export const SIC_TAGLINE = 'Das geprüfte Schweizer Mieter-Zertifikat'
/** Drei Wörter, die die AGB tragen: Plausibilität, einheitliches Format, QR. */
export const SIC_CERT_TAGLINE = 'Geprüft. Standardisiert. Prüfbar.'

/**
 * SEO/Meta — Vertrauen und Ernsthaftigkeit, nicht «gelesen werden».
 * Zertifikat-PDF darf «Vertrauenswürdig» nicht tragen (AGB: keine Empfehlung).
 */
export const SIC_META_DESCRIPTION =
  'Wohnungssuche Schweiz: Ungeprüfte Bewerber bleiben Risiko. Swiss Immo Cert prüft deine Angaben — der Vermieter kann sich darauf stützen. Nur seriöse Bewerber. Kein Abo.'

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
