/**
 * <img src="…"> aus HTML sammeln (absolute URLs).
 */
export function extractImageUrlsFromHtml(html: string, baseUrl: string): string[] {
  const base = (() => {
    try {
      return new URL(baseUrl)
    } catch {
      return null
    }
  })()
  const out: string[] = []
  const seen = new Set<string>()

  const push = (raw: string | undefined | null) => {
    if (!raw) return
    const u = raw.trim().split(/\s+/)[0]
    if (!u || u.startsWith('data:')) return
    let abs: string
    try {
      abs = base ? new URL(u, base).toString() : new URL(u).toString()
    } catch {
      return
    }
    if (!/^https?:\/\//i.test(abs)) return
    if (seen.has(abs)) return
    seen.add(abs)
    out.push(abs)
  }

  const re = /<img\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const tag = m[0]
    const src = /src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const dataSrc = /data-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const srcset = /srcset\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    push(src)
    push(dataSrc)
    if (srcset) {
      const first = srcset.split(',')[0]?.trim().split(/\s+/)[0]
      push(first)
    }
  }

  return out.slice(0, 30)
}
