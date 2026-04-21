/**
 * Freitext aus KI/JSON: oft literal "null" / "undefined" statt echtem Fehlen.
 */
export function ingestOptionalText(v: unknown): string {
  if (v == null) return ''
  if (typeof v !== 'string') return ''
  const t = v.trim()
  if (!t) return ''
  const low = t.toLowerCase()
  if (low === 'null' || low === 'undefined') return ''
  return t
}
