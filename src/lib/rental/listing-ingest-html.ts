const BAD_URL_HINTS = [
  'logo',
  'icon',
  'favicon',
  'avatar',
  'sprite',
  'placeholder',
  'tracking',
  'pixel',
  'mapbox',
  'googleapis.com/maps',
]

const GOOD_URL_HINTS = [
  'gallery',
  'listing',
  'property',
  'apartment',
  'wohnung',
  'immobil',
  'photo',
  'image',
]

function absUrl(base: URL | null, raw: string): string | null {
  const u = raw.trim().split(/\s+/)[0]
  if (!u || u.startsWith('data:')) return null
  try {
    const full = base ? new URL(u, base).toString() : new URL(u).toString()
    return /^https?:\/\//i.test(full) ? full : null
  } catch {
    return null
  }
}

function scoreImageCandidate(url: string, tag: string): number {
  const lowerUrl = url.toLowerCase()
  const lowerTag = tag.toLowerCase()
  let s = 0
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(lowerUrl)) s += 3
  if (GOOD_URL_HINTS.some(k => lowerUrl.includes(k) || lowerTag.includes(k))) s += 4
  if (BAD_URL_HINTS.some(k => lowerUrl.includes(k) || lowerTag.includes(k))) s -= 8
  if (/thumb|thumbnail|small|icon|logo/i.test(lowerUrl)) s -= 4
  if (lowerTag.includes('srcset')) s += 1
  return s
}

/**
 * Robuste Bild-Erkennung aus HTML:
 * - absolute + relative URLs
 * - src / data-src / srcset
 * - OG/Twitter-Images + JSON-LD image URLs
 * - heuristische Sortierung (Wohnungsfotos zuerst)
 */
export function extractImageUrlsFromHtml(html: string, baseUrl: string): string[] {
  const base = (() => {
    try {
      return new URL(baseUrl)
    } catch {
      return null
    }
  })()

  const scored = new Map<string, number>()
  const push = (raw: string | undefined | null, tag = '') => {
    if (!raw) return
    const url = absUrl(base, raw)
    if (!url) return
    const score = scoreImageCandidate(url, tag)
    if (score < -2) return
    scored.set(url, Math.max(scored.get(url) ?? -999, score))
  }

  const imgRe = /<img\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0]
    const src = /src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const dataSrc = /data-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const dataLazy = /data-lazy-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const srcset = /srcset\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    push(src, tag)
    push(dataSrc, tag)
    push(dataLazy, tag)
    if (srcset) {
      for (const part of srcset.split(',')) {
        push(part.trim().split(/\s+/)[0], `${tag} srcset`)
      }
    }
  }

  const metaRe = /<meta\b[^>]*>/gi
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0]
    const prop = /property\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? ''
    const name = /name\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? ''
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    if (!content) continue
    if (prop === 'og:image' || prop === 'og:image:url' || name === 'twitter:image') {
      push(content, `${tag} meta`)
    }
  }

  const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  while ((m = jsonLdRe.exec(html)) !== null) {
    const payload = m[1]
    const urlRe = /https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi
    let um: RegExpExecArray | null
    while ((um = urlRe.exec(payload)) !== null) {
      push(um[0], 'jsonld')
    }
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([u]) => u)
    .slice(0, 30)
}
