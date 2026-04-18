const MAX_TEXT_CHARS = 8000

/** Entfernt Script/Style und Tags; komprimiert Whitespace; max. maxChars. */
export function htmlToListingPlainText(html: string, maxChars: number = MAX_TEXT_CHARS): string {
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
  if (s.length > maxChars) s = s.slice(0, maxChars)
  return s
}
