import type { SicModuleStatus } from '@prisma/client'

/**
 * Status nach neuem Nachweis-Upload.
 * `docCountAfterUpload` + `minDocs`: Paar-Zertifikat erst IN_REVIEW, wenn genug Dateien da sind.
 */
export function nextModuleStatusAfterUpload(
  current: SicModuleStatus,
  opts?: { docCountAfterUpload?: number; minDocs?: number }
): SicModuleStatus | null {
  if (current !== 'PENDING_DOCS' && current !== 'REJECTED') return null
  const minDocs = opts?.minDocs ?? 1
  const count = opts?.docCountAfterUpload ?? 1
  if (count < minDocs) return null
  return 'IN_REVIEW'
}
