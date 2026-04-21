/** Minimale JPEG/PNG-Dimensionen ohne zusätzliche Dependencies (WebP: nur Magic-Check). */

function readUInt32BE(b: Buffer, o: number): number {
  return b.readUInt32BE(o)
}

function readUInt16BE(b: Buffer, o: number): number {
  return b.readUInt16BE(o)
}

function readUInt16LE(b: Buffer, o: number): number {
  return b.readUInt16LE(o)
}

function pngDimensions(b: Buffer): { w: number; h: number } | null {
  if (b.length < 24) return null
  if (b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) return null
  // IHDR chunk starts at byte 8+4+4 = 16
  const w = readUInt32BE(b, 16)
  const h = readUInt32BE(b, 20)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null
  return { w, h }
}

function jpegDimensions(b: Buffer): { w: number; h: number } | null {
  let o = 2
  while (o + 9 < b.length) {
    if (b[o] !== 0xff) {
      o += 1
      continue
    }
    const m = b[o + 1]
    if (m === 0xd8 || m === 0xd9) {
      o += 2
      continue
    }
    const len = readUInt16BE(b, o + 2)
    if (len < 2 || o + 2 + len > b.length) return null
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      const h = readUInt16BE(b, o + 5)
      const w = readUInt16BE(b, o + 7)
      if (w > 0 && h > 0) return { w, h }
    }
    o += 2 + len
  }
  return null
}

export function isWebpBuffer(b: Buffer): boolean {
  return (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
}

/** VP8 Keyframe: https://datatracker.ietf.org/doc/html/rfc6386 — width/height in sync code an Offset nach Frame-Tag */
function vp8Dimensions(b: Buffer, start: number): { w: number; h: number } | null {
  if (start + 10 > b.length) return null
  const bits = b.readUInt32LE(start)
  const w = (bits & 0x3fff) as number
  const h = ((bits >> 16) & 0x3fff) as number
  if (w > 0 && h > 0) return { w, h }
  return null
}

function webpDimensions(b: Buffer): { w: number; h: number } | null {
  let o = 12
  while (o + 8 <= b.length) {
    const tag = b.subarray(o, o + 4).toString('ascii')
    const size = b.readUInt32LE(o + 4)
    const chunkStart = o + 8
    const chunkEnd = chunkStart + size + (size & 1) // pad
    if (tag === 'VP8 ' && chunkStart + 10 <= b.length) {
      const d = vp8Dimensions(b, chunkStart + 6)
      if (d) return d
    }
    if (tag === 'VP8L' && chunkStart + 5 <= b.length) {
      const bits = b.readUInt32LE(chunkStart + 1)
      const w = 1 + (bits & 0x3fff)
      const h = 1 + ((bits >> 14) & 0x3fff)
      if (w > 0 && h > 0) return { w, h }
    }
    o = chunkEnd
    if (o <= chunkStart) break
  }
  return null
}

export function getImageDimensionsFromBuffer(buffer: Buffer): { w: number; h: number } | null {
  if (buffer.length < 3) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return jpegDimensions(buffer)
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return pngDimensions(buffer)
  if (isWebpBuffer(buffer)) return webpDimensions(buffer)
  return null
}

export function meetsMinImageSize(buffer: Buffer, min = 200): boolean {
  if (isWebpBuffer(buffer) && buffer.length > 800) {
    const d = webpDimensions(buffer)
    if (d) return d.w >= min && d.h >= min
    return true
  }
  const d = getImageDimensionsFromBuffer(buffer)
  if (!d) return false
  return d.w >= min && d.h >= min
}
