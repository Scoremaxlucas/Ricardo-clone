'use server'

import { MatchPropertySource } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { bulkImportMatchingProperties } from './bulk-import-matching-properties'
import { checkMatchingImportUploadRateLimit } from './matching-rate-limit'
import { parseMatchingImportCsvText, parseMatchingImportXlsxBuffer } from './import-parse'

export type ImportMatchingPropertiesFormResult =
  | {
      ok: true
      created: number
      errors: { index: number; message: string }[]
    }
  | { ok: false; error: string }

export async function importMatchingPropertiesFromUpload(formData: FormData): Promise<ImportMatchingPropertiesFormResult> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return { ok: false, error: 'Nicht angemeldet.' }
  }

  const rl = await checkMatchingImportUploadRateLimit(userId)
  if (!rl.allowed) {
    const s = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
    return { ok: false, error: `Zu viele Importe. Bitte in ca. ${s}s erneut versuchen.` }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Bitte eine CSV- oder Excel-Datei wählen.' }
  }

  const name = (file.name || '').toLowerCase()
  let flatRows: Record<string, string>[]

  try {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer()
      flatRows = parseMatchingImportXlsxBuffer(buf)
    } else {
      const text = await file.text()
      flatRows = parseMatchingImportCsvText(text)
    }
  } catch (e) {
    console.error('importMatchingPropertiesFromUpload parse', e)
    return { ok: false, error: 'Datei konnte nicht gelesen werden. Format prüfen (UTF-8 CSV oder .xlsx).' }
  }

  if (flatRows.length === 0) {
    return { ok: false, error: 'Keine Datenzeilen gefunden (Header + mindestens eine Zeile).' }
  }

  if (flatRows.length > 500) {
    return { ok: false, error: 'Maximal 500 Zeilen pro Import.' }
  }

  const { createdIds, errors } = await bulkImportMatchingProperties({
    userId,
    flatRows,
    source: MatchPropertySource.csv,
  })

  return {
    ok: true,
    created: createdIds.length,
    errors,
  }
}
