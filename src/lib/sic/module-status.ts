import type { SicModuleStatus } from '@prisma/client'

/** Status nach neuem Nachweis-Upload (Reject-Nachreichung muss wieder in Prüfung). */
export function nextModuleStatusAfterUpload(current: SicModuleStatus): SicModuleStatus | null {
  if (current === 'PENDING_DOCS' || current === 'REJECTED') return 'IN_REVIEW'
  return null
}
