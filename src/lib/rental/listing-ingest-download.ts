import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'

const USER_AGENT =
  'Mozilla/5.0 (compatible; HelvendarBot/1.0; +https://wohnen.helvenda.ch)'

function detectImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const b = buffer
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

export async function downloadRemoteImageBuffer(
  rawUrl: string,
  timeoutMs = 5000
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' | 'image/webp' } | null> {
  let safe: URL
  try {
    safe = await assertUrlSafeForServerFetch(rawUrl)
  } catch {
    return null
  }
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(safe.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 5 * 1024 * 1024) return null
    const headerType = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    let mime = detectImageMime(buf)
    if (!mime && (headerType === 'image/jpeg' || headerType === 'image/jpg')) mime = 'image/jpeg'
    if (!mime && headerType === 'image/png') mime = 'image/png'
    if (!mime && headerType === 'image/webp') mime = 'image/webp'
    if (!mime) return null
    return { buffer: buf, contentType: mime }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
