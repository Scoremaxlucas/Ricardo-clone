import { put } from '@vercel/blob'
import { sicLog } from '@/lib/sic/log'

/** Dedizierter SIC-Store (privat) hat Vorrang vor dem Helvenda-Store. */
export function sicBlobWriteToken(): string | undefined {
  return process.env.SIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined
}

/**
 * Öffentlicher Ciphertext-Fallback nur mit explizitem Opt-in.
 * Produktion: privaten Blob-Store anlegen und `SIC_BLOB_ALLOW_PUBLIC_FALLBACK` weglassen.
 */
export function sicBlobAllowPublicFallback(): boolean {
  return process.env.SIC_BLOB_ALLOW_PUBLIC_FALLBACK === 'true'
}

/**
 * Speichert verschlüsselte SIC-Nachweise im Blob-Store — bevorzugt privat.
 *
 * Ohne privaten Store und ohne `SIC_BLOB_ALLOW_PUBLIC_FALLBACK=true` schlägt
 * der Upload fehl (kein stiller Public-Fallback mehr).
 */
export async function putSicDocumentBytes(pathname: string, ciphertext: Buffer): Promise<string> {
  const token = sicBlobWriteToken()
  const options = {
    addRandomSuffix: true,
    contentType: 'application/octet-stream',
    ...(token ? { token } : {}),
  } as const

  try {
    const blob = await put(pathname, ciphertext, { ...options, access: 'private' })
    return blob.url
  } catch (err) {
    sicLog('sic.upload.private_put_failed', {
      reason: err instanceof Error ? err.message : 'unknown',
    })
    if (!sicBlobAllowPublicFallback()) {
      throw new Error(
        'Privater Blob-Store für SIC-Nachweise fehlt. SIC_BLOB_READ_WRITE_TOKEN setzen ' +
          'oder vorübergehend SIC_BLOB_ALLOW_PUBLIC_FALLBACK=true.'
      )
    }
  }

  const blob = await put(pathname, ciphertext, { ...options, access: 'public' })
  sicLog('sic.upload.public_encrypted_put', { pathname })
  return blob.url
}
