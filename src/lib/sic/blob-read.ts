import { sicLog } from '@/lib/sic/log'
import { get } from '@vercel/blob'

/**
 * Lädt einen Blob als Bytes. Privater Zugriff zuerst; schlägt er fehl, wird mit
 * Token nachgefragt, damit Dateien aus der Zeit vor der Umstellung lesbar bleiben.
 */
export async function readSicBlobBytes(blobUrl: string): Promise<Buffer | null> {
  try {
    const result = await get(blobUrl, { access: 'private' })
    if (result?.statusCode === 200 && result.stream) {
      const chunks: Uint8Array[] = []
      const reader = result.stream.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      return Buffer.concat(chunks.map(c => Buffer.from(c)))
    }
  } catch {
    sicLog('sic.blob.private_get_fallback', { reason: 'private_get_error' })
  }

  const headers: HeadersInit = {}
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(blobUrl, { headers })
  if (!res.ok) return null
  sicLog('sic.blob.private_get_fallback', { reason: 'public_or_token_fetch' })
  return Buffer.from(await res.arrayBuffer())
}
