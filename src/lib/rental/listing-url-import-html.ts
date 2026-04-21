const MAX_TEXT_CHARS = 8000

/** Extrahiert strukturierte JSON-LD-Inhalte als Flachtext (vor Script-Strip). */
function extractLinkedDataJsonLines(html: string): string {
  const chunks: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      chunks.push(JSON.stringify(parsed))
    } catch {
      chunks.push(raw.slice(0, 4000))
    }
  }
  return chunks.join('\n\n').trim()
}

/** Entfernt Script/Style und Tags; komprimiert Whitespace; max. maxChars. */
export function htmlToListingPlainText(html: string, maxChars: number = MAX_TEXT_CHARS): string {
  const ldPart = extractLinkedDataJsonLines(html)
  let s = html
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/&nbsp;/gi, ' ')
  s = s.replace(/&amp;/gi, '&')
  s = s.replace(/&lt;/gi, '<')
  s = s.replace(/&gt;/gi, '>')
  s = s.replace(/&quot;/gi, '"')
  s = s.replace(/&#(\d+);/g, (_, n) => {
    const code = Number.parseInt(n, 10)
    return Number.isFinite(code) ? String.fromCharCode(code) : ''
  })
  s = s.replace(/\s+/g, ' ').trim()
  const combined = [ldPart, s].filter(Boolean).join('\n\n').trim()
  if (combined.length > maxChars) return combined.slice(0, maxChars)
  return combined
}
