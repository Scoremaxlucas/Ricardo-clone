import crypto from 'crypto'

/**
 * Verschlüsselung der hochgeladenen Nachweise (AES-256-GCM).
 *
 * Anders als früher ist der Schlüssel **Pflicht**: ohne ihn verweigert der
 * Upload den Dienst, statt Lohnabrechnungen im Klartext abzulegen. Solange
 * nicht abschliessend geklärt ist, ob der Blob-Store privaten Zugriff
 * unterstützt, ist die Verschlüsselung das Einzige, was zwischen einer
 * Objekt-URL und dem Dokument steht.
 *
 * Format: IV || Tag || Cipher — identisch zum bisherigen Ablageformat, damit
 * bestehende Dateien weiterhin lesbar sind.
 */

const IV_LEN = 12
const TAG_LEN = 16
const KEY_HEX_LEN = 64

export const SIC_DOC_ENCRYPTION_ENV = 'SIC_DOC_ENCRYPTION_KEY'

function parseKey(hex: string | undefined): Buffer | null {
  const t = hex?.trim()
  if (!t || t.length < KEY_HEX_LEN) return null
  try {
    const buf = Buffer.from(t.slice(0, KEY_HEX_LEN), 'hex')
    return buf.length === 32 ? buf : null
  } catch {
    return null
  }
}

/** Aktiver Schlüssel zum Verschlüsseln. */
function primaryKey(): Buffer | null {
  return parseKey(process.env[SIC_DOC_ENCRYPTION_ENV]) ?? parseKey(process.env.RENTAL_PDF_ENCRYPTION_KEY)
}

/** Alle Kandidaten zum Entschlüsseln — deckt Dateien aus der Zeit vor der Umbenennung ab. */
function decryptionKeys(): Buffer[] {
  const keys = [parseKey(process.env[SIC_DOC_ENCRYPTION_ENV]), parseKey(process.env.RENTAL_PDF_ENCRYPTION_KEY)]
  const seen = new Set<string>()
  const out: Buffer[] = []
  for (const k of keys) {
    if (!k) continue
    const id = k.toString('hex')
    if (seen.has(id)) continue
    seen.add(id)
    out.push(k)
  }
  return out
}

export function isSicDocumentEncryptionConfigured(): boolean {
  return primaryKey() !== null
}

export function encryptSicDocument(plain: Buffer): Buffer {
  const key = primaryKey()
  if (!key) {
    throw new Error(`${SIC_DOC_ENCRYPTION_ENV} fehlt (64 Hex-Zeichen = 32 Bytes)`)
  }
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), enc])
}

/**
 * Entschlüsselt mit allen bekannten Schlüsseln. Schlägt alles fehl, wird das
 * Original zurückgegeben — Dateien aus der Zeit ohne Schlüssel bleiben lesbar.
 */
export function decryptSicDocument(stored: Buffer): { buffer: Buffer; decrypted: boolean } {
  if (stored.length < IV_LEN + TAG_LEN + 1) return { buffer: stored, decrypted: false }
  const iv = stored.subarray(0, IV_LEN)
  const tag = stored.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = stored.subarray(IV_LEN + TAG_LEN)

  for (const key of decryptionKeys()) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(tag)
      return { buffer: Buffer.concat([decipher.update(enc), decipher.final()]), decrypted: true }
    } catch {
      // Nächster Schlüssel.
    }
  }
  return { buffer: stored, decrypted: false }
}
