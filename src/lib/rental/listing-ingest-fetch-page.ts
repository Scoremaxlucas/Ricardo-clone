import { extractImageUrlsFromHtml } from '@/lib/rental/listing-ingest-html'
/**
 * Robuster HTML-Fetch für Admin-Ingest (Tutti & Co. — oft kein vollständiges SSR-HTML).
 */

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
}

function abortAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const ac = new AbortController()
  setTimeout(() => ac.abort(), ms)
  return ac.signal
}

export type FetchPageContentResult = {
  html: string
  imageUrls: string[]
  blocked: boolean
  status: number
}

export function extractOpenGraphFromHtml(metaHtml: string): {
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
} {
  const ogTitle = metaHtml.match(
    /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1]
  const ogTitleAlt = metaHtml.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i
  )?.[1]
  const ogDescription = metaHtml.match(
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1]
  const ogDescriptionAlt = metaHtml.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i
  )?.[1]
  const ogImage = metaHtml.match(
    /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1]
  const ogImageAlt = metaHtml.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i
  )?.[1]
  return {
    ogTitle: (ogTitle || ogTitleAlt)?.trim(),
    ogDescription: (ogDescription || ogDescriptionAlt)?.trim(),
    ogImage: (ogImage || ogImageAlt)?.trim(),
  }
}

export async function fetchOpenGraphHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: BROWSER_HEADERS,
    signal: abortAfter(5000),
  })
  return await res.text()
}

export async function fetchPageContent(url: string): Promise<FetchPageContentResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: BROWSER_HEADERS,
      signal: abortAfter(10_000),
    })

    const status = response.status

    if (status === 401 || status === 403 || status === 429) {
      return { html: '', imageUrls: [], blocked: true, status }
    }

    if (status === 404 || status === 410) {
      throw new Error('PAGE_NOT_FOUND')
    }

    const html = await response.text()
    const finalUrl = response.url || url
    const imageUrls = extractImageUrlsFromHtml(html, finalUrl)

    return {
      html,
      imageUrls: Array.from(new Set(imageUrls)).slice(0, 12),
      blocked: false,
      status,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'PAGE_NOT_FOUND') {
      throw error
    }
    throw new Error(`FETCH_FAILED: ${String(error)}`)
  }
}

export function buildPlainTextFromOpenGraph(og: {
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}): string {
  const parts: string[] = []
  if (og.ogTitle) parts.push(`Open-Graph Titel: ${og.ogTitle}`)
  if (og.ogDescription) parts.push(`Open-Graph Beschreibung: ${og.ogDescription}`)
  if (og.ogImage) parts.push(`Open-Graph Bild-URL: ${og.ogImage}`)
  return parts.join('\n\n').trim()
}
