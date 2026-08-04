/**
 * Shared visual tokens for SIC Nachweisformulare (print + AcroForm).
 * Units: PDF points. 1 mm ≈ 2.834645669 pt.
 */

export const MM = 2.834645669

export const A4 = { width: 210 * MM, height: 297 * MM } as const

export const MARGIN = {
  x: 20 * MM,
  top: 18 * MM,
  bottom: 18 * MM,
} as const

/** Vertical rhythm. */
export const GRID = 6 * MM

export const LAYOUT = {
  contentWidth: A4.width - MARGIN.x * 2,
  colGutter: 3.5 * MM,
  fieldHeight: 8 * MM,
  labelGap: 1 * MM,
  labelHeight: 2.8 * MM,
  fieldBlockGap: 2.4 * MM,
  sectionGapBefore: 3.5 * MM,
  sectionGapAfter: 2.2 * MM,
  checkboxSize: 3.5 * MM,
  checkboxTextGap: 2.5 * MM,
  optionGap: 4.5 * MM,
  signaturePadHeight: 16 * MM,
  textareaHeight: 14 * MM,
  borderRadius: 2,
} as const

export const COL = {
  full: LAYOUT.contentWidth,
  half: (LAYOUT.contentWidth - LAYOUT.colGutter) / 2,
} as const

export const COLORS = {
  navy: { r: 15 / 255, g: 43 / 255, b: 94 / 255 },
  gold: { r: 184 / 255, g: 145 / 255, b: 47 / 255 },
  red: { r: 200 / 255, g: 16 / 255, b: 46 / 255 },
  ink: { r: 0.12, g: 0.14, b: 0.18 },
  muted: { r: 0.42, g: 0.46, b: 0.52 },
  border: { r: 203 / 255, g: 210 / 255, b: 221 / 255 }, // #CBD2DD
  fieldBg: { r: 1, g: 1, b: 1 },
  rule: { r: 0.88, g: 0.9, b: 0.93 },
  hint: { r: 0.55, g: 0.58, b: 0.62 },
} as const

/** Typography scale (pt). */
export const TYPE = {
  docTitle: 16,
  section: 8.5,
  label: 7,
  value: 10,
  body: 8.5,
  footer: 7,
  brand: 10.5,
  brandSub: 6.5,
  docMeta: 7.5,
} as const
