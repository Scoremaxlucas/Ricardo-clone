/**
 * Helpers for AI routes that accept images (base64 data URL or URL).
 */

const MAX_BASE64_BYTES = 4 * 1024 * 1024 // 4MB

/**
 * Normalize image input to base64 string (no data URL prefix).
 * - data:image/...;base64,xxx → xxx
 * - https://... → fetch, then base64
 * - raw base64 → return as-is
 */
export async function imageInputToBase64(input: string): Promise<string> {
  const s = (input || '').trim()
  if (!s) throw new Error('Kein Bild angegeben')

  // Data URL
  const dataUrlMatch = s.match(/^data:image\/[a-z]+;base64,(.+)$/i)
  if (dataUrlMatch) {
    const b64 = dataUrlMatch[1]
    if (b64.length < 100) throw new Error('Ungültiges Bild-Format oder Bild zu klein')
    if (b64.length > MAX_BASE64_BYTES)
      throw new Error('Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild (max. ca. 3 MB).')
    return b64
  }

  // URL
  if (s.startsWith('http://') || s.startsWith('https://')) {
    const res = await fetch(s, { headers: { Accept: 'image/*' } })
    if (!res.ok) throw new Error('Bild konnte nicht geladen werden')
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    if (b64.length < 100) throw new Error('Ungültiges Bild-Format oder Bild zu klein')
    if (b64.length > MAX_BASE64_BYTES)
      throw new Error('Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild (max. ca. 3 MB).')
    return b64
  }

  // Raw base64
  if (s.length < 100) throw new Error('Ungültiges Bild-Format oder Bild zu klein')
  if (s.length > MAX_BASE64_BYTES)
    throw new Error('Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild (max. ca. 3 MB).')
  return s
}
