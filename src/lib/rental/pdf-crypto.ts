import crypto from 'crypto'

const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer | null {
  const hex = process.env.RENTAL_PDF_ENCRYPTION_KEY?.trim()
  if (!hex || hex.length < 64) return null
  try {
    return Buffer.from(hex.slice(0, 64), 'hex')
  } catch {
    return null
  }
}

/** Verschlüsselt PDF-Bytes (AES-256-GCM). Rückgabe: ein Binärpaket IV||Tag||Cipher für Blob-Upload. */
export function encryptPdfForStorage(pdfBuffer: Buffer): Buffer {
  const key = getKey()
  if (!key) {
    throw new Error('RENTAL_PDF_ENCRYPTION_KEY fehlt (64 Hex-Zeichen = 32 Bytes)')
  }
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(pdfBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc])
}

/** Wenn `RENTAL_PDF_ENCRYPTION_KEY` gesetzt: verschlüsselt; sonst Klartext-PDF (nur Dev). */
export function encryptPdfForStorageBestEffort(pdfBuffer: Buffer): { buffer: Buffer; encrypted: boolean } {
  const key = getKey()
  if (!key) {
    console.warn('[rental-pdf] RENTAL_PDF_ENCRYPTION_KEY fehlt — PDF wird unverschlüsselt gespeichert')
    return { buffer: pdfBuffer, encrypted: false }
  }
  return { buffer: encryptPdfForStorage(pdfBuffer), encrypted: true }
}

const LANDLORD_PLAIN_PREFIX = 'PLAIN1:'

/** Interner Vermieter-Kontakt (UTF-8) — gleicher Schlüssel wie PDF; DB-Feld nur für Admins. */
export function encryptLandlordContactForStorage(plain: string | null | undefined): string | null {
  const t = typeof plain === 'string' ? plain.trim() : ''
  if (!t) return null
  const { buffer, encrypted } = encryptPdfForStorageBestEffort(Buffer.from(t, 'utf8'))
  if (!encrypted) {
    return `${LANDLORD_PLAIN_PREFIX}${t}`
  }
  return `GCM1:${buffer.toString('base64')}`
}

export function decryptLandlordContactFromStorage(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (stored.startsWith(LANDLORD_PLAIN_PREFIX)) {
    return stored.slice(LANDLORD_PLAIN_PREFIX.length)
  }
  if (!stored.startsWith('GCM1:')) return null
  const key = getKey()
  if (!key) return null
  const raw = Buffer.from(stored.slice('GCM1:'.length), 'base64')
  if (raw.length < IV_LEN + TAG_LEN) return null
  const iv = raw.subarray(0, IV_LEN)
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = raw.subarray(IV_LEN + TAG_LEN)
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
