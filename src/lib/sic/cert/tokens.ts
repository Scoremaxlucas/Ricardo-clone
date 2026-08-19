/** Design-Tokens für das SIC-Zertifikat-PDF (Urkundenoptik). */

export const CERT = {
  page: {
    /** A4 in pt */
    width: 595.28,
    height: 841.89,
    padding: 18,
  },
  frame: {
    outer: 2.4,
    inner: 0.9,
    gap: 4,
    padV: 22,
    padH: 28,
  },
  color: {
    navy: '#0f2b5e',
    navyDeep: '#0a1f45',
    gold: '#b8912f',
    goldLight: '#d8b25a',
    goldPale: '#e8d5a3',
    ivory: '#fbf9f3',
    ivorySoft: '#f7f3ea',
    ink: '#1e293b',
    muted: '#64748b',
    faint: '#e7ddc4',
    red: '#c8102e',
    white: '#ffffff',
  },
  type: {
    brand: 22,
    brandSub: 8.5,
    tagline: 8.5,
    holderLabel: 7.5,
    holderName: 16,
    moduleTitle: 10.5,
    moduleLine: 9,
    badge: 7,
    dateLabel: 7,
    dateValue: 11,
    legal: 6.2,
    code: 7.5,
    seal: 11,
  },
} as const
