import { detectSicUploadMime, sicUploadContentType } from '@/lib/sic/file-signature'
import { describe, expect, it } from 'vitest'

function bytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

describe('detectSicUploadMime', () => {
  it('erkennt echtes PDF am Anfang', () => {
    expect(detectSicUploadMime(bytes('25 50 44 46 2D 31 2E 34'))).toBe('application/pdf')
  })

  it('erkennt PDF auch mit ein paar Bytes BOM/Whitespace davor', () => {
    expect(detectSicUploadMime(bytes('20 20 25 50 44 46 2D 31'))).toBe('application/pdf')
  })

  it('erkennt JPEG (JFIF/EXIF-Start)', () => {
    expect(detectSicUploadMime(bytes('FF D8 FF E0 00 10 4A 46 49 46'))).toBe('image/jpeg')
    expect(detectSicUploadMime(bytes('FF D8 FF E1 00 22 45 78 69 66'))).toBe('image/jpeg')
  })

  it('erkennt PNG', () => {
    expect(detectSicUploadMime(bytes('89 50 4E 47 0D 0A 1A 0A 00 00'))).toBe('image/png')
  })

  it('erkennt WEBP', () => {
    // 'RIFF' + Grösse (00 00 00 00) + 'WEBP'
    expect(detectSicUploadMime(bytes('52 49 46 46 00 00 00 00 57 45 42 50'))).toBe('image/webp')
  })

  it('lehnt ausführbare / andere Formate ab', () => {
    // Windows PE (MZ)
    expect(detectSicUploadMime(bytes('4D 5A 90 00 03 00 00 00'))).toBeNull()
    // ELF (Linux)
    expect(detectSicUploadMime(bytes('7F 45 4C 46 02 01 01 00'))).toBeNull()
    // ZIP (auch .docx/.xlsx — wir wollen die auf SIC nicht)
    expect(detectSicUploadMime(bytes('50 4B 03 04 14 00 00 00'))).toBeNull()
    // GIF
    expect(detectSicUploadMime(bytes('47 49 46 38 39 61 01 00'))).toBeNull()
    // Leerer Puffer
    expect(detectSicUploadMime(new Uint8Array(0))).toBeNull()
  })

  it('erkennt kein PDF, wenn die Signatur zu weit hinten steht (typischer Wrapper-Trick)', () => {
    // 20 Byte Vorlauf, dann %PDF- — nicht mehr innerhalb der ersten 8 Bytes.
    const buf = new Uint8Array(30)
    buf.set([0x25, 0x50, 0x44, 0x46, 0x2d], 20)
    expect(detectSicUploadMime(buf)).toBeNull()
  })
})

describe('sicUploadContentType', () => {
  it('nimmt die Signatur, wenn der Browser keinen oder einen generischen Typ schickt', () => {
    expect(sicUploadContentType({ claimed: '', detected: 'application/pdf' })).toBe('application/pdf')
    expect(sicUploadContentType({ claimed: 'application/octet-stream', detected: 'image/jpeg' })).toBe(
      'image/jpeg'
    )
  })

  it('lehnt Widerspruch zwischen Header und Bytes ab', () => {
    expect(sicUploadContentType({ claimed: 'image/png', detected: 'application/pdf' })).toBeNull()
  })

  it('akzeptiert, wenn Header und Bytes übereinstimmen', () => {
    expect(sicUploadContentType({ claimed: 'application/pdf', detected: 'application/pdf' })).toBe(
      'application/pdf'
    )
  })
})
