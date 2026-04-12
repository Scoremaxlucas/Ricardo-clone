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
