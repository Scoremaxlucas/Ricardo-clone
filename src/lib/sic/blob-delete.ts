import { sicBlobWriteToken } from '@/lib/sic/blob-put'
import { sicLog } from '@/lib/sic/log'
import { del } from '@vercel/blob'

/**
 * Löscht eine SIC-Datei im selben Store, in den sie geschrieben wurde. Ohne den
 * Token des dedizierten SIC-Stores schlägt `del` dort fehl — die DB-Zeile wäre
 * weg, die verschlüsselte Datei bliebe liegen.
 *
 * Best-effort: gibt false zurück statt zu werfen, damit ein Blob-Fehler keinen
 * bereits geschriebenen DB-Zustand kippt. Fehler landen im Log.
 */
export async function deleteSicBlob(blobUrl: string): Promise<boolean> {
  // Dateien aus der Zeit vor dem eigenen SIC-Store liegen im Helvenda-Store.
  const tokens = Array.from(
    new Set([sicBlobWriteToken(), process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined])
  )
  let lastErr: unknown
  for (const token of tokens) {
    try {
      await del(blobUrl, token ? { token } : undefined)
      return true
    } catch (err) {
      lastErr = err
    }
  }
  sicLog('sic.blob.delete_failed', {
    message: lastErr instanceof Error ? lastErr.message : 'unknown',
  })
  return false
}
