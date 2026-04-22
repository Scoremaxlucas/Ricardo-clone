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

export function isApartmentPhoto(url: string): boolean {
  const lower = url.toLowerCase()
  const hasImageExt = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
  const hasImageHint =
    /image|img|photo|media|cdn|upload|listing|gallery|property|wohnung|immobil/.test(lower)
  if (!hasImageExt && !hasImageHint) return false

  const blockedPatterns = [
    'logo',
    'icon',
    'favicon',
    'sprite',
    'placeholder',
    'avatar',
    'profile',
    'user',
    'badge',
    'banner',
    'header',
    'footer',
    'nav',
    'menu',
    'button',
    'arrow',
    'chevron',
    'close',
    'search',
    'star',
    'rating',
    'social',
    'facebook',
    'twitter',
    'instagram',
    'linkedin',
    'whatsapp',
    'share',
    'print',
    'map',
    '1x1',
    'pixel',
    'tracking',
    'analytics',
    'spacer',
    'blank',
    'transparent',
    'empty',
    'default',
    'thumbnail-placeholder',
    'no-image',
    'noimage',
    '/static/',
    '/assets/icons/',
    '/assets/logos/',
    '/ui/',
    '/components/',
    '/layout/',
  ]
  if (blockedPatterns.some(p => lower.includes(p))) return false
  if (/[_-](16|24|32|48|64|96|100|128|150|160|200)x\1/i.test(url)) return false
  return true
}

/**
 * Prioritäts-Reihenfolge:
 * 1) og:image / twitter:image
 * 2) JSON-LD
 * 3) <img src/srcset>
 * 4) data-src / data-lazy-src
 */
export function extractImageUrlsFromHtml(html: string, baseUrl: string): string[] {
  const base = (() => {
    try {
      return new URL(baseUrl)
    } catch {
      return null
    }
  })()

  const metaImages: string[] = []
  const jsonLdImages: string[] = []
  const imgTagImages: string[] = []
  const dataSrcImages: string[] = []
  const push = (arr: string[], raw: string | undefined | null) => {
    if (!raw) return
    const url = absUrl(base, raw)
    if (url) arr.push(url)
  }

  const ogImageMatches = Array.from(
    html.matchAll(
      /<meta[^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]+content=["']([^"']+)["'][^>]*>/gi
    )
  )
  for (const match of ogImageMatches) {
    if (match[1].startsWith('http')) metaImages.push(match[1])
  }
  const ogImageMatches2 = Array.from(
    html.matchAll(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]*>/gi
    )
  )
  for (const match of ogImageMatches2) {
    if (match[1].startsWith('http')) metaImages.push(match[1])
  }

  const imgRe = /<img\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0]
    const src = /src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const srcset = /srcset\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const dataSrc = /data-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const dataLazy = /data-lazy-src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    push(imgTagImages, src)
    if (srcset) {
      for (const part of srcset.split(',')) {
        push(imgTagImages, part.trim().split(/\s+/)[0])
      }
    }
    push(dataSrcImages, dataSrc)
    push(dataSrcImages, dataLazy)
  }

  const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  while ((m = jsonLdRe.exec(html)) !== null) {
    const payload = m[1]
    const urlRe = /https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi
    let um: RegExpExecArray | null
    while ((um = urlRe.exec(payload)) !== null) {
      jsonLdImages.push(um[0])
    }
  }

  return [...metaImages, ...jsonLdImages, ...imgTagImages, ...dataSrcImages]
    .filter(isApartmentPhoto)
    .filter((url, index, arr) => arr.indexOf(url) === index)
    .slice(0, 30)
}
