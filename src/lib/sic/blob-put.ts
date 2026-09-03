import { put } from '@vercel/blob'
import { sicLog } from '@/lib/sic/log'

/**
 * Speichert verschlüsselte SIC-Nachweise im Blob-Store.
 *
 * `access: 'private'` braucht einen *privaten* Vercel-Blob-Store. Der
 * Helvenda-Store ist öffentlich (Inseratsbilder). Ein privater Put dort
 * schlägt fehl — das war der 502 beim Kunden-Upload. Fallback: öffentlich
 * ablegen. Die Datei bleibt AES-256-GCM-Ciphertext unter einem zufälligen
 * Pfad, also ohne den Schlüssel nicht lesbar.
 */
export async function putSicDocumentBytes(pathname: string, ciphertext: Buffer): Promise<string> {
  const options = {
    addRandomSuffix: true,
    contentType: 'application/octet-stream',
  } as const

  try {
    const blob = await put(pathname, ciphertext, { ...options, access: 'private' })
    return blob.url
  } catch (err) {
    sicLog('sic.upload.private_put_failed', {
      reason: err instanceof Error ? err.message : 'unknown',
    })
  }

  const blob = await put(pathname, ciphertext, { ...options, access: 'public' })
  sicLog('sic.upload.public_encrypted_put', { pathname })
  return blob.url
}
